from datetime import timedelta

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.accounts.models import ProviderApplication, User
from apps.accounts.permissions import IsActiveAccount, IsApprovedPhysiotherapist, IsPatient
from .catalog import SPECIALTIES
from .matching import accept_offer, advance_search, eligible
from .models import Booking, Coverage, Offer, RESERVED_STATUSES, CONTACT_STATUSES, BookingEvent
from .notifications import notify_patient
from .payments import configured
from .pricing import session_fee
from .serializers import BookingInput, CoverageInput, LocationInput, SearchInput


def coverage_data(coverage):
    application = ProviderApplication.objects.filter(user=coverage.user).first()
    return {"session_fee": session_fee(application) if application else None, "label": coverage.label, "latitude": coverage.center.y if coverage.center else None,
            "longitude": coverage.center.x if coverage.center else None,
            "radius_km": coverage.radius_km, "availability": coverage.availability,
            "confirmed": coverage.center is not None}


def booking_data(booking, user):
    assigned = booking.provider_id == user.pk
    own = booking.patient_id == user.pk
    data = {"id": str(booking.pk), "specialty": booking.specialty, "services": booking.services, "service_labels": [SPECIALTIES[code] for code in booking.services], "service": ", ".join(SPECIALTIES[code] for code in booking.services),
            "payment_enabled": configured(), "status": booking.status, "scheduled": booking.scheduled, "starts_at": booking.starts_at,
            "ends_at": booking.ends_at, "max_fee": booking.max_fee, "currency": "KES", "travel_included": True, "quoted_fee": str(booking.quoted_fee) if booking.quoted_fee is not None else None,
            "provider_name": booking.provider.full_name if booking.provider_id else None,
            "search_expires_at": booking.search_expires_at,
            "booking_mode": booking.mode}
    if own or (assigned and booking.status in CONTACT_STATUSES):
        data.update(location={"label": booking.area_label, "latitude": booking.location.y, "longitude": booking.location.x}, directions=booking.directions)
    else:
        data["approximate_area"] = "Within your chosen service area"
    if assigned and booking.status in CONTACT_STATUSES:
        data["patient_contact"] = {"full_name": booking.patient.full_name, "phone": booking.patient.phone, "email": booking.patient.email}
    pending = booking.reschedules.filter(status="pending").first()
    data["reschedule"] = {"id": pending.pk, "starts_at": pending.starts_at} if pending else None
    data["review"] = {"rating": booking.review.rating, "comment": booking.review.comment} if hasattr(booking, "review") else None
    data["events"] = list(booking.events.order_by("created_at", "pk").values("action", "created_at"))
    payment = booking.payments.order_by("-created_at").first()
    data["payment"] = {"id": str(payment.pk), "status": payment.status, "amount": payment.amount} if payment else None
    return data


@api_view(["GET"])
@permission_classes([IsActiveAccount])
def catalogue(request):
    return Response({"specialties": [{"code": code, "label": label} for code, label in SPECIALTIES.items()], "session_minutes": 60})


@api_view(["GET", "POST"])
@permission_classes([IsActiveAccount])
def provider_coverage(request):
    if request.user.role != User.Role.PHYSIOTHERAPIST:
        raise PermissionDenied("A physiotherapist account is required.")
    if request.method == "GET":
        coverage = Coverage.objects.filter(user=request.user).first()
        return Response(coverage_data(coverage) if coverage else {"label": "", "latitude": None, "longitude": None, "radius_km": 10, "availability": "offline", "confirmed": False})
    serializer = CoverageInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    with transaction.atomic():
        User.objects.select_for_update(no_key=True).get(pk=request.user.pk)
        if data["availability"] != "offline" and not ProviderApplication.objects.filter(user=request.user, verification_status="approved").exists():
            raise PermissionDenied("Your professional verification must be approved before receiving requests.")
        coverage, _ = Coverage.objects.update_or_create(user=request.user, defaults={
            "label": data["label"], "center": LocationInput.point(data),
            "radius_km": data["radius_km"], "availability": data["availability"],
        })
    return Response(coverage_data(coverage))


@api_view(["POST"])
@permission_classes([IsPatient])
def discover(request):
    serializer = SearchInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    starts = data.get("starts_at", timezone.now())
    providers = eligible(LocationInput.point(data), data["services"], starts, starts + timedelta(minutes=60), "starts_at" in data, max_fee=data["max_fee"])[:30]
    return Response({"providers": [
        {"id": item.user_id, "name": item.user.full_name,
         "specialty": ", ".join(SPECIALTIES[code] for code in item.user.provider_application.services),
         "services": item.user.provider_application.services,
         "distance_km": round(item.distance_m.m / 1000, 1),
         "experience": item.user.provider_application.experience,
         "session_fee": item.session_fee, "currency": "KES", "pricing_tier": item.user.provider_application.pricing_tier, "travel_included": True,
         "availability": item.availability}
        for item in providers
    ]})


@api_view(["GET", "POST"])
@permission_classes([IsPatient])
def bookings(request):
    if request.method == "GET":
        # One transaction per booking avoids holding multiple booking locks across dispatches.
        ids = list(Booking.objects.filter(patient=request.user).order_by("-created_at").values_list("pk", flat=True)[:30])
        result = []
        for pk in ids:
            with transaction.atomic():
                booking = Booking.objects.select_for_update(of=("self",)).select_related("provider").get(pk=pk)
                advance_search(booking)
                result.append(booking_data(booking, request.user))
        return Response({"bookings": result})
    serializer = BookingInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    with transaction.atomic():
        User.objects.select_for_update(no_key=True).get(pk=request.user.pk)
        for active in Booking.objects.select_for_update().filter(patient=request.user, status="searching"):
            advance_search(active)
            if active.status == Booking.Status.SEARCHING:
                raise ValidationError("You already have an active search. Cancel it before starting another.")
        starts = data.get("starts_at", timezone.now())
        quoted_fee = None
        if data.get("preferred_provider_id"):
            candidate = eligible(LocationInput.point(data), data["services"], starts, starts+timedelta(minutes=60), "starts_at" in data, max_fee=data["max_fee"]).filter(user_id=data["preferred_provider_id"]).first()
            if not candidate:
                raise ValidationError("The selected physiotherapist is unavailable within your budget, location or time.")
            if data.get("expected_fee") != candidate.session_fee:
                raise ValidationError("The provider's rate changed or was not confirmed. Refresh the provider list and confirm the price.")
            quoted_fee = candidate.session_fee
        booking = Booking.objects.create(patient=request.user, max_fee=data["max_fee"], quoted_fee=quoted_fee, specialty=data["specialty"], services=data["services"],
            location=LocationInput.point(data), area_label=data["label"], directions=data.get("directions", ""),
            mode="choose" if data.get("preferred_provider_id") else "automatic",
            preferred_provider_id=data.get("preferred_provider_id"), starts_at=starts,
            ends_at=starts+timedelta(minutes=60), scheduled="starts_at" in data,
            search_expires_at=timezone.now()+timedelta(minutes=5))
        notify_patient(booking, "created")
        advance_search(booking)
        return Response(booking_data(booking, request.user), status=201)


@api_view(["POST"])
@permission_classes([IsActiveAccount])
def cancel_booking(request, booking_id):
    with transaction.atomic():
        booking = get_object_or_404(Booking.objects.select_for_update(), pk=booking_id)
        if request.user.pk not in [booking.patient_id, booking.provider_id]:
            raise PermissionDenied("This booking does not belong to you.")
        if booking.status not in ["searching", "payment_pending", "confirmed", "en_route", "arrived", "no_match", "expired"]:
            raise ValidationError("This booking cannot be cancelled.")
        if booking.payments.filter(status__in=["initiating", "pending", "unknown"]).exists():
            raise ValidationError("A payment is still being checked. Resolve it before cancelling this appointment.")
        booking.payments.filter(status="succeeded").update(status="refund_required")
        booking.status = Booking.Status.CANCELLED
        booking.save(update_fields=["status"])
        booking.offers.filter(status="open").update(status="closed")
        booking.reschedules.filter(status="pending").update(status="cancelled")
        BookingEvent.objects.create(booking=booking, actor=request.user, action="cancelled")
        notify_patient(booking, "cancelled")
    return Response(booking_data(booking, request.user))


@api_view(["GET"])
@permission_classes([IsApprovedPhysiotherapist])
def offers(request):
    ids = list(Offer.objects.filter(provider=request.user, status="open").values_list("booking_id", flat=True).distinct())
    for pk in ids:
        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(pk=pk)
            advance_search(booking)
    open_offers = Offer.objects.filter(provider=request.user, status="open", expires_at__gt=timezone.now(), booking__status="searching").select_related("booking", "booking__provider")
    accepted = Booking.objects.filter(provider=request.user, status__in=[*RESERVED_STATUSES, "completed"]).select_related("provider", "patient").order_by("starts_at")[:30]
    return Response({"offers": [{"id": offer.pk, "expires_at": offer.expires_at, "booking": {**booking_data(offer.booking, request.user), "quoted_fee": str(offer.quoted_fee) if offer.quoted_fee is not None else None}} for offer in open_offers],
                     "appointments": [booking_data(booking, request.user) for booking in accepted]})


@api_view(["POST"])
@permission_classes([IsApprovedPhysiotherapist])
def respond_offer(request, offer_id, action):
    if action == "accept":
        booking = accept_offer(request.user, offer_id)
        return Response(booking_data(booking, request.user))
    if action != "decline":
        raise ValidationError("Choose accept or decline.")
    with transaction.atomic():
        offer = get_object_or_404(Offer, pk=offer_id, provider=request.user)
        booking = Booking.objects.select_for_update().get(pk=offer.booking_id)
        offer.refresh_from_db()
        if booking.status != "searching" or offer.status != "open" or offer.expires_at <= timezone.now():
            raise ValidationError("This offer is no longer open.")
        offer.status = "declined"
        offer.save(update_fields=["status"])
        advance_search(booking)
    return Response({"status": "declined"})
