from datetime import datetime, timezone as datetime_timezone

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .authentication import SessionJWTAuthentication
from .models import AuthSession


def issue_session(user):
    token = RefreshToken.for_user(user)
    session = AuthSession.objects.create(
        user=user, refresh_jti=token["jti"],
        expires_at=datetime.fromtimestamp(token["exp"], tz=datetime_timezone.utc),
    )
    token["sid"] = str(session.pk)
    return token


def read_refresh(raw):
    if not isinstance(raw, str) or not raw or len(raw) > 4096:
        raise AuthenticationFailed("Your session has expired. Please sign in again.")
    try:
        token = RefreshToken(raw)
        SessionJWTAuthentication().get_user(token)
        return token
    except TokenError:
        raise AuthenticationFailed("Your session has expired. Please sign in again.")


def rotate_session(raw):
    previous = read_refresh(raw)
    with transaction.atomic():
        session = AuthSession.objects.select_for_update().select_related("user").filter(pk=previous["sid"]).first()
        if not session or session.revoked_at or session.expires_at <= timezone.now() or session.refresh_jti != previous["jti"]:
            raise AuthenticationFailed("Your session has expired. Please sign in again.")
        # Recheck the account/password after obtaining the lock.
        user = SessionJWTAuthentication().get_user(previous)
        token = RefreshToken.for_user(user)
        token["sid"] = str(session.pk)
        token["exp"] = int(session.expires_at.timestamp())
        session.refresh_jti = token["jti"]
        session.save(update_fields=["refresh_jti"])
        return token


def revoke_session(raw):
    token = read_refresh(raw)
    AuthSession.objects.filter(pk=token["sid"], user_id=token["user_id"]).update(revoked_at=timezone.now())
