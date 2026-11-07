import uuid

from django.conf import settings
from django.contrib.gis.db import models
from django.db.models import Q
from django.contrib.postgres.fields import ArrayField
from .catalog import SPECIALTIES


class Coverage(models.Model):
    class Mode(models.TextChoices):
        NOW = "available_now", "Available now"
        SCHEDULED = "scheduled_only", "Scheduled appointments only"
        OFFLINE = "offline", "Offline"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="coverage")
    label = models.CharField(max_length=200)
    center = models.PointField(srid=4326, geography=True, null=True, blank=True)
    radius_km = models.PositiveSmallIntegerField(default=10)
    availability = models.CharField(max_length=20, choices=Mode.choices, default=Mode.OFFLINE)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=Q(radius_km__in=[5, 10, 15]), name="coverage_radius_options"),
            models.CheckConstraint(condition=Q(availability__in=["available_now", "scheduled_only", "offline"]), name="coverage_valid_mode"),
            models.CheckConstraint(condition=Q(availability="offline") | Q(center__isnull=False), name="online_requires_center"),
        ]


class Booking(models.Model):
    class Status(models.TextChoices):
        SEARCHING = "searching", "Finding a physiotherapist"
        NO_MATCH = "no_match", "No available physiotherapist"
        PAYMENT_PENDING = "payment_pending", "Provider accepted; payment integration pending"
        CONFIRMED = "confirmed", "Payment confirmed"
        EN_ROUTE = "en_route", "Physiotherapist on the way"
        ARRIVED = "arrived", "Physiotherapist arrived"
        IN_PROGRESS = "in_progress", "Session in progress"
        COMPLETED = "completed", "Session completed"
        CANCELLED = "cancelled", "Cancelled"
        EXPIRED = "expired", "Search expired"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="patient_bookings")
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.PROTECT, related_name="provider_bookings")
    preferred_provider = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="direct_requests")
    mode = models.CharField(max_length=10, choices=[("automatic", "Automatic matching"), ("choose", "Chosen physiotherapist")], default="automatic")
    specialty = models.CharField(max_length=30)
    services = ArrayField(models.CharField(max_length=30, choices=list(SPECIALTIES.items())), default=list, size=3)
    location = models.PointField(srid=4326, geography=True)
    area_label = models.CharField(max_length=200)
    directions = models.CharField(max_length=500, blank=True)
    scheduled = models.BooleanField(default=False)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.SEARCHING)
    # No invented charge: fee setup and validated payment initiation remain separate.
    max_fee = models.PositiveIntegerField(default=4500)
    quoted_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    search_expires_at = models.DateTimeField()

    class Meta:
        constraints = [
            models.CheckConstraint(condition=Q(services__len__gte=1, services__len__lte=3), name="booking_one_to_three_services"),
            models.CheckConstraint(condition=Q(services__contained_by=list(SPECIALTIES)), name="booking_known_services"),
            models.CheckConstraint(condition=Q(ends_at__gt=models.F("starts_at")), name="booking_positive_duration"),
            models.UniqueConstraint(fields=["patient"], condition=Q(status="searching"), name="one_patient_active_search"),
        ]
        indexes = [models.Index(fields=["provider", "status", "starts_at", "ends_at"])]


class Offer(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Awaiting response"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        CLOSED = "closed", "Closed"
        EXPIRED = "expired", "Expired"

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="offers")
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="booking_offers")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    quoted_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    expires_at = models.DateTimeField()

    class Meta:
        constraints = [models.UniqueConstraint(fields=["booking", "provider"], name="one_offer_per_provider_booking")]


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="notifications")
    kind = models.CharField(max_length=80)
    title = models.CharField(max_length=160)
    body = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [models.UniqueConstraint(fields=["user", "booking", "kind"], name="one_booking_notification_event")]
        indexes = [models.Index(fields=["user", "read_at", "created_at"])]


# Exact pins and clinical preferences stay behind authenticated, owner-scoped APIs.
class PatientProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="patient_profile")
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=40, blank=True)
    mobility_needs = models.CharField(max_length=500, blank=True)
    communication = models.CharField(max_length=100, blank=True)
    care_notes = models.CharField(max_length=1000, blank=True)
    emergency_name = models.CharField(max_length=200, blank=True)
    emergency_relationship = models.CharField(max_length=100, blank=True)
    emergency_phone = models.CharField(max_length=20, blank=True)
    push_enabled = models.BooleanField(default=False)


class SavedLocation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_locations")
    label = models.CharField(max_length=100)
    point = models.PointField(srid=4326, geography=True)


class BookingEvent(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="events")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=40)
    created_at = models.DateTimeField(auto_now_add=True)


class RescheduleRequest(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="reschedules")
    starts_at = models.DateTimeField()
    status = models.CharField(max_length=20, default="pending", choices=[("pending", "Pending"), ("accepted", "Accepted"), ("declined", "Declined"), ("cancelled", "Cancelled")])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["booking"], condition=Q(status="pending"), name="one_pending_reschedule")]


class Review(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="review")
    rating = models.PositiveSmallIntegerField()
    comment = models.CharField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.CheckConstraint(condition=Q(rating__gte=1, rating__lte=5), name="review_rating_range")]


class Message(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    client_id = models.UUIDField()
    text = models.CharField(max_length=2000, blank=True)
    attachment = models.FileField(upload_to="chat/%Y/%m", blank=True)
    filename = models.CharField(max_length=100, blank=True)
    mime = models.CharField(max_length=40, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["sender", "client_id"], name="unique_message_send")]
        indexes = [models.Index(fields=["booking", "created_at"])]


class SupportTicket(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    subject = models.CharField(max_length=160)
    body = models.CharField(max_length=3000)
    status = models.CharField(max_length=20, default="open", choices=[("open", "Open"), ("resolved", "Resolved")])
    created_at = models.DateTimeField(auto_now_add=True)


class PushDevice(models.Model):
    session = models.ForeignKey("accounts.AuthSession", null=True, blank=True, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.CharField(max_length=200, unique=True)
    active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)


class PushDelivery(models.Model):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE)
    device = models.ForeignKey(PushDevice, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, default="queued")
    ticket = models.CharField(max_length=200, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    error = models.CharField(max_length=100, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["notification", "device"], name="unique_push_delivery")]


RESERVED_STATUSES = ["payment_pending", "confirmed", "en_route", "arrived", "in_progress"]
CONTACT_STATUSES = RESERVED_STATUSES


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(Booking, on_delete=models.PROTECT, related_name="payments")
    client_id = models.UUIDField(unique=True)
    amount = models.PositiveIntegerField()
    phone = models.CharField(max_length=20)
    status = models.CharField(max_length=30, default="initiating", choices=[("initiating", "Initiating"), ("pending", "Awaiting payment"), ("unknown", "Needs reconciliation"), ("succeeded", "Verified payment"), ("failed", "Payment unsuccessful"), ("refund_required", "Refund needs administrator action")])
    checkout_id = models.CharField(max_length=150, null=True, blank=True, unique=True)
    merchant_id = models.CharField(max_length=150, blank=True)
    callback_token = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    checked_at = models.DateTimeField(null=True, blank=True)
    result_code = models.CharField(max_length=30, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["booking"], condition=Q(status__in=["initiating", "pending", "unknown", "succeeded", "refund_required"]), name="one_unresolved_or_paid_booking_payment"),
        ]
