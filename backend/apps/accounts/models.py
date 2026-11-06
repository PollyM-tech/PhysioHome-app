import uuid

from django.db.models.functions import Lower
from django.contrib.auth.models import AbstractUser, UserManager
from django.core.exceptions import ValidationError
from django.db import models


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
    experience = models.CharField(max_length=50)
    service_area = models.CharField(max_length=200)
    verification_status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    review_note = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_applications")
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.full_name}: {self.verification_status}"


class AuthSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="auth_sessions")
    refresh_jti = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
