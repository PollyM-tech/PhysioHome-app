import uuid

import phonenumbers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed

from .models import ProviderApplication, User


def normalize_phone(value):
    try:
        number = phonenumbers.parse(value, "KE")
        if not phonenumbers.is_valid_number(number):
            raise ValueError
        return phonenumbers.format_number(number, phonenumbers.PhoneNumberFormat.E164)
    except (phonenumbers.NumberParseException, ValueError):
        raise serializers.ValidationError("Enter a valid phone number, for example +254712345678.")


class RegisterSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=200)
    email = serializers.EmailField(max_length=254)
    phone = serializers.CharField(max_length=30)
    password = serializers.CharField(write_only=True, trim_whitespace=False, max_length=128)
    role = serializers.ChoiceField(choices=[User.Role.PATIENT, User.Role.PHYSIOTHERAPIST])
    agreed_to_terms = serializers.BooleanField()
    license_number = serializers.CharField(max_length=100, required=False)
    specialty = serializers.CharField(max_length=120, required=False)
    experience = serializers.CharField(max_length=50, required=False)
    service_area = serializers.CharField(max_length=200, required=False)
    transport = serializers.ChoiceField(choices=["token", "cookie"], default="token")

    def validate(self, attrs):
        attrs["email"] = attrs["email"].strip().lower()
        attrs["phone"] = normalize_phone(attrs["phone"])
        if not attrs["agreed_to_terms"]:
            raise serializers.ValidationError({"agreed_to_terms": "Accept the terms to continue."})
        candidate = User(email=attrs["email"], full_name=attrs["full_name"])
        try:
            validate_password(attrs["password"], candidate)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"password": error.messages})
        if User.objects.filter(email__iexact=attrs["email"]).exists() or User.objects.filter(phone=attrs["phone"]).exists():
            raise serializers.ValidationError("An account could not be created with these details. Try signing in or recovering your password.")
        if attrs["role"] == User.Role.PHYSIOTHERAPIST:
            for field in ("license_number", "specialty", "experience", "service_area"):
                if not attrs.get(field):
                    raise serializers.ValidationError({field: "This field is required for physiotherapists."})
        return attrs

    def create(self, validated_data):
        provider = {key: validated_data.pop(key, "") for key in ("license_number", "specialty", "experience", "service_area")}
        validated_data.pop("agreed_to_terms")
        validated_data.pop("transport")
        try:
            with transaction.atomic():
                user = User.objects.create_user(username=uuid.uuid4().hex, terms_accepted_at=timezone.now(), **validated_data)
                if user.role == User.Role.PHYSIOTHERAPIST:
                    ProviderApplication.objects.create(user=user, **provider)
                return user
        except IntegrityError:
            raise serializers.ValidationError("An account could not be created with these details.")


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField(max_length=254)
    password = serializers.CharField(trim_whitespace=False, max_length=128)
    role = serializers.ChoiceField(choices=[User.Role.PATIENT, User.Role.PHYSIOTHERAPIST])
    transport = serializers.ChoiceField(choices=["token", "cookie"], default="token")

    def validate(self, attrs):
        identifier = attrs["identifier"].strip()
        if "@" in identifier:
            account = User.objects.filter(email__iexact=identifier).first()
        else:
            try:
                account = User.objects.filter(phone=normalize_phone(identifier)).first()
            except serializers.ValidationError:
                account = None
        # Authenticate even for unknown identifiers to perform the password hasher's dummy work.
        user = authenticate(request=self.context.get("request"), username=account.username if account else uuid.uuid4().hex, password=attrs["password"])
        if not user or user.account_status != User.AccountStatus.ACTIVE or user.role != attrs["role"]:
            raise AuthenticationFailed("The sign-in details are incorrect or this account is unavailable.")
        attrs["user"] = user
        return attrs


class CurrentUserSerializer(serializers.ModelSerializer):
    verification_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "full_name", "email", "phone", "role", "account_status", "verification_status"]
        read_only_fields = fields

    def get_verification_status(self, obj):
        if obj.role != User.Role.PHYSIOTHERAPIST:
            return None
        application = ProviderApplication.objects.filter(user=obj).first()
        return application.verification_status if application else "pending"
