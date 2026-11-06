from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import AuthSession


class SessionJWTAuthentication(JWTAuthentication):
    """Signed tokens plus server-side sessions allow immediate logout/revocation."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        sid = validated_token.get("sid")
        try:
            valid = sid and AuthSession.objects.filter(
                pk=sid, user=user, revoked_at__isnull=True, expires_at__gt=timezone.now()
            ).exists()
        except (ValueError, TypeError, ValidationError):
            valid = False
        if not valid or user.account_status != user.AccountStatus.ACTIVE:
            raise AuthenticationFailed("Your session has expired. Please sign in again.")
        return user
