from datetime import timedelta

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.accounts.models import User, ProviderApplication
from apps.accounts.permissions import IsActiveAccount, IsPatient
from .matching import eligible
from .models import Booking, BookingEvent, RescheduleRequest, Review, RESERVED_STATUSES
from .serializers import SearchInput
from .views import booking_data
from .notifications import create_notification
from django.conf import settings


def participant(user, booking):
    if user.pk not in [booking.patient_id, booking.provider_id]:
        raise PermissionDenied("This appointment does not belong to you.")


def event(booking, actor, action, title, body):
    item = BookingEvent.objects.create(booking=booking, actor=actor, action=action)
    create_notification(booking, "event:" + str(item.pk), title, body)


class RescheduleInput(serializers.Serializer):
    starts_at = serializers.DateTimeField()

    def validate_starts_at(self, value):
        return SearchInput().validate_starts_at(value)


@api_view(["POST"])
@permission_classes([IsPatient])
def reschedule(request, booking_id):
    serializer = RescheduleInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    with transaction.atomic():
        booking = get_object_or_404(Booking.objects.select_for_update(), pk=booking_id, patient=request.user)
        if booking.status not in ["payment_pending", "confirmed"] or booking.starts_at <= timezone.now():
            raise ValidationError("Only upcoming accepted appointments can be rescheduled.")
        if booking.reschedules.filter(status="pending").exists():
            raise ValidationError("A time change is already awaiting your physiotherapist's response.")
        if serializer.validated_data["starts_at"] == booking.starts_at:
            raise ValidationError("Choose a different time.")
        RescheduleRequest.objects.create(booking=booking, **serializer.validated_data)
        event(booking, request.user, "reschedule_requested", "Time change requested", "Your physiotherapist must accept the new time. Your existing appointment stays reserved until then.")
    return Response(booking_data(booking, request.user))


@api_view(["POST"])
@permission_classes([IsActiveAccount])
def respond_reschedule(request, booking_id, action):
    if action not in ["accept", "decline"]:
        raise ValidationError("Choose accept or decline.")
    with transaction.atomic():
        User.objects.select_for_update(no_key=True).get(pk=request.user.pk)
        booking = get_object_or_404(Booking.objects.select_for_update(), pk=booking_id, provider=request.user)
        if not ProviderApplication.objects.filter(user=request.user, verification_status="approved").exists():
            raise PermissionDenied("Professional approval is required.")
        change = get_object_or_404(RescheduleRequest, booking=booking, status="pending")
        if booking.status not in ["payment_pending", "confirmed"] or booking.starts_at <= timezone.now():
            raise ValidationError("This appointment can no longer be rescheduled.")
        if action == "accept":
            starts = SearchInput().validate_starts_at(change.starts_at)
            ends = starts + timedelta(minutes=60)
            if not eligible(booking.location, booking.services, starts, ends, True, exclude_booking=booking.pk).filter(user=request.user).exists():
                raise ValidationError("The proposed time conflicts with your availability or another appointment.")
            booking.starts_at, booking.ends_at, booking.scheduled = starts, ends, True
            booking.save(update_fields=["starts_at", "ends_at", "scheduled"])
        change.status = "accepted" if action == "accept" else "declined"
        change.save(update_fields=["status"])
        event(booking, request.user, "reschedule_" + change.status, "Time change " + change.status, "Check Bookings for your confirmed appointment time.")
    return Response(booking_data(booking, request.user))


@api_view(["POST"])
@permission_classes([IsActiveAccount])
def progress(request, booking_id, action):
    transitions = {"en_route": ["payment_pending", "confirmed"], "arrived": ["en_route"], "in_progress": ["arrived"], "completed": ["in_progress"]}
    if action not in transitions:
        raise ValidationError("Choose a valid appointment step.")
    with transaction.atomic():
        User.objects.select_for_update(no_key=True).get(pk=request.user.pk)
        booking = get_object_or_404(Booking.objects.select_for_update(), pk=booking_id, provider=request.user)
        if not ProviderApplication.objects.filter(user=request.user, verification_status="approved").exists():
            raise PermissionDenied("Professional approval is required.")
        if booking.status == action:
            return Response(booking_data(booking, request.user))
        if settings.MPESA_ENABLED and booking.status == "payment_pending":
            raise ValidationError("Payment must be verified before the physiotherapist departs.")
        if booking.status not in transitions[action]:
            raise ValidationError("Follow the appointment steps in order.")
        if booking.starts_at > timezone.now() + timedelta(hours=2):
            raise ValidationError("Appointment progress is available within two hours of the scheduled visit.")
        booking.status = action
        booking.save(update_fields=["status"])
        booking.reschedules.filter(status="pending").update(status="cancelled")
        title = {"en_route": "Physiotherapist on the way", "arrived": "Physiotherapist arrived", "in_progress": "Session started", "completed": "Session completed"}[action]
        event(booking, request.user, action, title, "Open Bookings to view the latest appointment update.")
    return Response(booking_data(booking, request.user))


class ReviewInput(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(max_length=1000, required=False, allow_blank=True)


@api_view(["POST"])
@permission_classes([IsPatient])
def review(request, booking_id):
    serializer = ReviewInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    with transaction.atomic():
        booking = get_object_or_404(Booking.objects.select_for_update(), pk=booking_id, patient=request.user)
        if booking.status != "completed":
            raise ValidationError("You can review a completed session only.")
        if Review.objects.filter(booking=booking).exists():
            raise ValidationError("You have already reviewed this session.")
        Review.objects.create(booking=booking, **serializer.validated_data)
    return Response(booking_data(booking, request.user), status=201)
