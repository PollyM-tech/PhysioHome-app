import uuid

from django.db.models.functions import Lower
from django.contrib.auth.models import AbstractUser, UserManager
from django.core.exceptions import ValidationError
from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from apps.marketplace.catalog import SPECIALTIES


class AccountManager(UserManager):
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Role.ADMIN)
        extra_fields.setdefault("account_status", User.AccountStatus.ACTIVE)
        if extra_fields["role"] != User.Role.ADMIN:
            raise ValueError("Superusers must have the admin role.")
        if extra_fields["account_status"] != User.AccountStatus.ACTIVE:
            raise ValueError("Superusers must have active account status.")
        return super().create_superuser(username, email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        PATIENT = "patient", "Patient"
        PHYSIOTHERAPIST = "physiotherapist", "Physiotherapist"
        ADMIN = "admin", "Administrator"

    class AccountStatus(models.TextChoices):
        ACTIVE = "active", "Active"
        SUSPENDED = "suspended", "Suspended"

    full_name = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PATIENT)
    account_status = models.CharField(
        max_length=20, choices=AccountStatus.choices, default=AccountStatus.ACTIVE
    )
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = AccountManager()

    class Meta:
        constraints = [
            models.UniqueConstraint(Lower("email"), condition=~models.Q(email=""), name="account_unique_email_ci"),
            models.UniqueConstraint(fields=["phone"], condition=~models.Q(phone=""), name="account_unique_phone"),
            models.CheckConstraint(condition=models.Q(role__in=["patient", "physiotherapist", "admin"]), name="account_valid_role"),
            models.CheckConstraint(condition=models.Q(account_status__in=["active", "suspended"]), name="account_valid_status"),
            models.CheckConstraint(condition=~models.Q(account_status="suspended") | models.Q(is_active=False), name="suspended_account_inactive"),
            models.CheckConstraint(condition=models.Q(is_superuser=False) | models.Q(role="admin"), name="superuser_admin_role"),
        ]

    def clean(self):
        super().clean()
        if self.account_status == self.AccountStatus.SUSPENDED and self.is_active:
            raise ValidationError({"is_active": "Suspended accounts must be inactive."})
        if self.is_superuser and self.role != self.Role.ADMIN:
            raise ValidationError({"role": "Superusers must have the admin role."})


class ProviderApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        SUSPENDED = "suspended", "Suspended"
        EXPIRED = "expired", "Expired"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="provider_application")
    license_number = models.CharField(max_length=100)
    specialty = models.CharField(max_length=120)
    services = ArrayField(models.CharField(max_length=30, choices=list(SPECIALTIES.items())), default=list, size=3)
    pricing_tier = models.CharField(max_length=20, blank=True, choices=[("early", "1 to under 3 years"), ("experienced", "3 to under 5 years"), ("senior", "5+ years"), ("consultant", "Approved consultant")])
    consultant_fee = models.PositiveIntegerField(null=True, blank=True)
    pricing_reviewed_at = models.DateTimeField(null=True, blank=True)
    pricing_reviewed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_provider_prices")
    experience = models.CharField(max_length=50)
    service_area = models.CharField(max_length=200)
    verification_status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    review_note = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_applications")
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [GinIndex(fields=["services"])]
        constraints = [
            models.CheckConstraint(condition=models.Q(pricing_tier__in=["", "early", "experienced", "senior", "consultant"]), name="provider_valid_pricing_tier"),
            models.CheckConstraint(condition=(models.Q(pricing_tier="consultant", consultant_fee__gte=3500, consultant_fee__lte=4500, consultant_fee__isnull=False) | (~models.Q(pricing_tier="consultant") & models.Q(consultant_fee__isnull=True))), name="provider_consultant_rate_range"),
            models.CheckConstraint(condition=models.Q(services__len__lte=3), name="provider_at_most_three_services"),
            models.CheckConstraint(condition=models.Q(services__contained_by=list(SPECIALTIES)), name="provider_known_services"),
        ]

    def clean(self):
        super().clean()
        if self.pricing_tier and not self.review_note.strip():
            raise ValidationError({"review_note": "Record the verified experience or consultant credentials for this rate."})
        if self.pricing_tier == "consultant":
            if self.consultant_fee is None or not 3500 <= self.consultant_fee <= 4500:
                raise ValidationError({"consultant_fee": "Set one exact consultant rate between KES 3,500 and 4,500."})
        elif self.consultant_fee is not None:
            raise ValidationError({"consultant_fee": "A custom rate is available only for approved consultants."})

    def __str__(self):
        return f"{self.user.full_name}: {self.verification_status}"


class AuthSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="auth_sessions")
    refresh_jti = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
