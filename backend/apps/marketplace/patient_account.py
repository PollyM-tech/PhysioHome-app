from .throttles import PatientWriteThrottle

from django.db import IntegrityError, transaction
from django.db.models import Count
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from apps.accounts.models import User, AuthSession
from apps.accounts.permissions import IsPatient
from apps.accounts.serializers import CurrentUserSerializer, normalize_phone
from .models import PatientProfile, SavedLocation, Booking, SupportTicket, PushDevice, PushDelivery, RESERVED_STATUSES
from .serializers import LocationInput


class ProfileInput(serializers.ModelSerializer):
    full_name = serializers.CharField(max_length=200)
    email = serializers.EmailField(max_length=254)
    phone = serializers.CharField(max_length=30)
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True, trim_whitespace=False, max_length=128)

    class Meta:
        model = PatientProfile
        fields = ["full_name", "email", "phone", "current_password", "date_of_birth", "gender", "mobility_needs", "communication", "care_notes", "emergency_name", "emergency_relationship", "emergency_phone"]

    def validate_date_of_birth(self, value):
        if value and (value > timezone.localdate() or value.year < timezone.localdate().year - 120):
            raise serializers.ValidationError("Enter a valid date of birth.")
        return value

    def validate_phone(self, value):
        return normalize_phone(value)

    def validate_emergency_phone(self, value):
        return normalize_phone(value) if value else ""

    def validate(self, data):
        user = self.context["user"]
        data["email"] = data["email"].lower().strip()
        if (data["email"] != user.email or data["phone"] != user.phone) and not user.check_password(data.get("current_password", "")):
            raise serializers.ValidationError({"current_password": "Enter your current password to change contact details."})
        if User.objects.exclude(pk=user.pk).filter(email__iexact=data["email"]).exists() or User.objects.exclude(pk=user.pk).filter(phone=data["phone"]).exists():
            raise serializers.ValidationError("Those contact details are unavailable.")
        return data


def profile_data(user):
    profile, _ = PatientProfile.objects.get_or_create(user=user)
    counts = dict(Booking.objects.filter(patient=user).values_list("status").annotate(total=Count("id")))
    return {"account": CurrentUserSerializer(user).data,
            "profile": {field: getattr(profile, field) for field in ["date_of_birth", "gender", "mobility_needs", "communication", "care_notes", "emergency_name", "emergency_relationship", "emergency_phone", "push_enabled"]},
            "counts": {"active": sum(counts.get(s, 0) for s in ["searching", *RESERVED_STATUSES]), "completed": counts.get("completed", 0), "locations": user.saved_locations.count()}}


@api_view(["GET", "POST"])
@permission_classes([IsPatient])
@throttle_classes([PatientWriteThrottle])
def profile(request):
    if request.method == "POST":
        data = ProfileInput(data=request.data, context={"user": request.user})
        data.is_valid(raise_exception=True)
        values = data.validated_data.copy()
        values.pop("current_password", None)
        try:
            with transaction.atomic():
                user = User.objects.select_for_update().get(pk=request.user.pk)
                for field in ["full_name", "phone", "email"]:
                    setattr(user, field, values.pop(field))
                user.save(update_fields=["full_name", "phone", "email", "updated_at"])
                PatientProfile.objects.update_or_create(user=user, defaults=values)
        except IntegrityError:
            raise ValidationError("Those contact details are unavailable.")
    else:
        user = request.user
    response = Response(profile_data(user))
    response["Cache-Control"] = "no-store"
    return response


class LocationSaveInput(LocationInput):
    label = serializers.CharField(max_length=100)
    id = serializers.IntegerField(required=False, min_value=1)
    delete = serializers.BooleanField(default=False)


@api_view(["GET", "POST"])
@permission_classes([IsPatient])
@throttle_classes([PatientWriteThrottle])
def locations(request):
    if request.method == "POST":
        serializer = LocationSaveInput(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with transaction.atomic():
            User.objects.select_for_update().get(pk=request.user.pk)
            item = get_object_or_404(SavedLocation, user=request.user, pk=data["id"]) if data.get("id") else None
            if data["delete"]:
                if not item:
                    raise ValidationError("Choose a saved location to remove.")
                item.delete()
            elif item:
                item.label = data["label"]
                item.point = LocationInput.point(data)
                item.save()
            else:
                if request.user.saved_locations.count() >= 10:
                    raise ValidationError("You can save up to ten locations.")
                SavedLocation.objects.create(user=request.user, label=data["label"], point=LocationInput.point(data))
    response = Response({"locations": [{"id": x.pk, "label": x.label, "latitude": x.point.y, "longitude": x.point.x} for x in request.user.saved_locations.order_by("pk")]})
    response["Cache-Control"] = "no-store"
    return response


class SupportInput(serializers.Serializer):
    subject = serializers.CharField(max_length=160)
    body = serializers.CharField(max_length=3000)


@api_view(["GET", "POST"])
@permission_classes([IsPatient])
@throttle_classes([PatientWriteThrottle])
def support(request):
    if request.method == "POST":
        serializer = SupportInput(data=request.data)
        serializer.is_valid(raise_exception=True)
        SupportTicket.objects.create(user=request.user, **serializer.validated_data)
    return Response({"tickets": list(SupportTicket.objects.filter(user=request.user).order_by("-created_at")[:30].values("id", "subject", "body", "status", "created_at"))})


class PushInput(serializers.Serializer):
    enabled = serializers.BooleanField()
    token = serializers.RegexField(r"^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$", max_length=200, required=False)


@api_view(["POST"])
@permission_classes([IsPatient])
@throttle_classes([PatientWriteThrottle])
def push_preferences(request):
    data = PushInput(data=request.data)
    data.is_valid(raise_exception=True)
    enabled, token = data.validated_data["enabled"], data.validated_data.get("token")
    if enabled and not token:
        raise ValidationError("A device push token is required.")
    sid = request.auth.get("sid") if request.auth else None
    session = AuthSession.objects.filter(pk=sid, user=request.user, revoked_at__isnull=True, expires_at__gt=timezone.now()).first() if sid else None
    if enabled and not session:
        raise ValidationError("Sign in again before enabling push notifications.")
    with transaction.atomic():
        profile, _ = PatientProfile.objects.get_or_create(user=request.user)
        profile.push_enabled = enabled
        profile.save(update_fields=["push_enabled"])
        if token:
            device, created = PushDevice.objects.select_for_update().get_or_create(token=token, defaults={"user": request.user, "session": session, "active": enabled})
            if not created and device.user_id != request.user.pk:
                # Never deliver the old account's queued updates after a device switches accounts.
                PushDelivery.objects.filter(device=device, status="queued").update(status="skipped")
            device.user, device.session, device.active = request.user, session, enabled
            device.save(update_fields=["user", "session", "active", "updated_at"])
        if not enabled:
            PushDevice.objects.filter(user=request.user).update(active=False)
            PushDelivery.objects.filter(device__user=request.user, status="queued").update(status="skipped")
    return Response({"enabled": enabled})


class PasswordInput(serializers.Serializer):
    current_password = serializers.CharField(max_length=128, trim_whitespace=False)
    new_password = serializers.CharField(max_length=128, trim_whitespace=False)


@api_view(["POST"])
@permission_classes([IsPatient])
@throttle_classes([PatientWriteThrottle])
def password(request):
    from django.contrib.auth.password_validation import validate_password
    from django.core.exceptions import ValidationError as DjangoValidationError
    serializer = PasswordInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    with transaction.atomic():
        user = User.objects.select_for_update().get(pk=request.user.pk)
        if not user.check_password(serializer.validated_data["current_password"]):
            raise ValidationError("The current password is incorrect.")
        try:
            validate_password(serializer.validated_data["new_password"], user)
        except DjangoValidationError as error:
            raise ValidationError(error.messages)
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password", "updated_at"])
        AuthSession.objects.filter(user=user, revoked_at__isnull=True).update(revoked_at=timezone.now())
        PushDevice.objects.filter(user=user).update(active=False)
    return Response({"detail": "Password updated. Sign in again on your devices."})
