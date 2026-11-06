from urllib.parse import urlsplit

from django.conf import settings
from django.contrib.auth.forms import PasswordResetForm, SetPasswordForm
from django.contrib.auth.views import PasswordResetConfirmView
from django.db import transaction
from django.middleware.csrf import get_token
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import AuthSession
from .permissions import IsActiveAccount
from .serializers import CurrentUserSerializer, LoginSerializer, RegisterSerializer
from .sessions import issue_session, revoke_session, rotate_session

COOKIE_NAME = "physiohome_refresh"
COOKIE_PATH = "/api/v1/auth/"


def csrf_check(request):
    SessionAuthentication().enforce_csrf(request)


def refresh_input(request):
    if "refresh" in request.data:
        return request.data["refresh"], False
    csrf_check(request)
    return request.COOKIES.get(COOKIE_NAME), True


def token_response(token, user, cookie=False, status_code=200):
    data = {"access": str(token.access_token), "user": CurrentUserSerializer(user).data}
    if not cookie:
        data["refresh"] = str(token)
    response = Response(data, status=status_code)
    response["Cache-Control"] = "no-store"
    if cookie:
        response.set_cookie(
            COOKIE_NAME, str(token), max_age=max(0, token["exp"] - int(timezone.now().timestamp())),
            httponly=True, secure=not settings.DEBUG, samesite="Lax", path=COOKIE_PATH,
        )
    return response


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def csrf(request):
    response = Response({"csrfToken": get_token(request)})
    response["Cache-Control"] = "no-store"
    return response


class PublicAuthView(GenericAPIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]

    def get_authenticate_header(self, request):
        # Public endpoints authenticate credentials in their payload, not the header.
        # Preserve HTTP 401 for invalid credentials rather than DRF's default 403.
        return "Bearer"

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.method == "POST" and not isinstance(request.data, dict):
            raise serializers.ValidationError("Send a JSON object.")


class RegisterView(PublicAuthView):
    serializer_class = RegisterSerializer
    throttle_scope = "register"

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cookie = serializer.validated_data["transport"] == "cookie"
        if cookie:
            csrf_check(request)
        with transaction.atomic():
            user = serializer.save()
            token = issue_session(user)
        return token_response(token, user, cookie, status.HTTP_201_CREATED)


class LoginView(PublicAuthView):
    serializer_class = LoginSerializer
    throttle_scope = "login"

    def post(self, request):
        if request.data.get("transport") == "cookie":
            csrf_check(request)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        return token_response(issue_session(user), user, serializer.validated_data["transport"] == "cookie")


class RefreshView(PublicAuthView):
    throttle_scope = "refresh"

    def post(self, request):
        raw, cookie = refresh_input(request)
        token = rotate_session(raw)
        return token_response(token, token_user(token), cookie)


def token_user(token):
    from .authentication import SessionJWTAuthentication
    return SessionJWTAuthentication().get_user(token)


class LogoutView(PublicAuthView):
    throttle_scope = "refresh"

    def post(self, request):
        raw, cookie = refresh_input(request)
        if raw:
            try:
                revoke_session(raw)
            except AuthenticationFailed:
                # Logout is idempotent; an expired/revoked session still clears the browser cookie.
                pass
        response = Response(status=204)
        if cookie:
            response.delete_cookie(COOKIE_NAME, path=COOKIE_PATH, samesite="Lax")
        response["Cache-Control"] = "no-store"
        return response


class MeView(GenericAPIView):
    permission_classes = [IsActiveAccount]
    serializer_class = CurrentUserSerializer

    def get(self, request):
        response = Response(self.get_serializer(request.user).data)
        response["Cache-Control"] = "no-store"
        return response


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=254)


class PasswordResetRequestView(PublicAuthView):
    serializer_class = PasswordResetRequestSerializer
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        form = PasswordResetForm({"email": serializer.validated_data["email"]})
        form.is_valid()
        origin = urlsplit(settings.PUBLIC_API_ORIGIN)
        form.save(
            request=request, use_https=origin.scheme == "https", domain_override=origin.netloc,
            email_template_name="accounts/password_reset_email.txt",
            subject_template_name="accounts/password_reset_subject.txt",
            from_email=settings.DEFAULT_FROM_EMAIL,
        )
        return Response({"detail": "If an eligible account exists, a password reset link will be sent."})


class RevokeSessionsSetPasswordForm(SetPasswordForm):
    def save(self, commit=True):
        with transaction.atomic():
            user = super().save(commit=commit)
            if commit:
                AuthSession.objects.filter(user=user, revoked_at__isnull=True).update(revoked_at=timezone.now())
            return user


class ResetPasswordConfirmView(PasswordResetConfirmView):
    form_class = RevokeSessionsSetPasswordForm
    template_name = "accounts/password_reset_confirm.html"
