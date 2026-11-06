import re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.db import close_old_connections, connections
from django.test import TestCase, TransactionTestCase, override_settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from rest_framework.views import APIView

from .models import AuthSession, ProviderApplication
from .permissions import IsAccountOwner, IsApprovedPhysiotherapist, IsPatient, IsPlatformAdmin

User = get_user_model()
PASSWORD = "SafeCare2026!"


def registration(**changes):
    return {"full_name": "Care Patient", "email": "patient@example.com", "phone": "0712345678", "password": PASSWORD, "role": "patient", "agreed_to_terms": True, **changes}


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AuthAPITests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def signup(self, **changes):
        return self.client.post("/api/v1/auth/register/", registration(**changes), format="json")

    def signin(self, **changes):
        return self.client.post("/api/v1/auth/login/", {"identifier": "patient@example.com", "password": PASSWORD, "role": "patient", **changes}, format="json")

    def bearer(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_registration_hashes_password_and_me_only_returns_own_safe_fields(self):
        response = self.signup(is_staff=True, is_superuser=True, verification_status="approved")
        self.assertEqual(response.status_code, 201)
        user = User.objects.get()
        self.assertTrue(user.check_password(PASSWORD))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertIsNotNone(user.terms_accepted_at)
        self.assertEqual(user.phone, "+254712345678")
        self.bearer(response.data["access"])
        me = self.client.get("/api/v1/me/")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["id"], user.pk)
        self.assertNotIn("password", me.data)
        self.assertNotIn("refresh", me.data)

    def test_anonymous_me_is_rejected(self):
        self.assertEqual(self.client.get("/api/v1/me/").status_code, 401)

    def test_public_registration_cannot_create_admin(self):
        self.assertEqual(self.signup(role="admin").status_code, 400)
        self.assertFalse(User.objects.exists())

    def test_weak_password_and_missing_consent_are_rejected(self):
        self.assertEqual(self.signup(password="password").status_code, 400)
        self.assertEqual(self.signup(agreed_to_terms=False).status_code, 400)
        self.assertFalse(User.objects.exists())

    def test_duplicate_email_case_and_normalized_phone_are_rejected(self):
        self.assertEqual(self.signup().status_code, 201)
        self.assertEqual(self.signup(email="PATIENT@example.com", phone="+254722345678").status_code, 400)
        self.assertEqual(self.signup(email="other@example.com", phone="+254712345678").status_code, 400)
        self.assertEqual(User.objects.count(), 1)

    def test_provider_details_required_and_status_is_always_pending(self):
        self.assertEqual(self.signup(role="physiotherapist").status_code, 400)
        response = self.signup(role="physiotherapist", license_number="TEST-123", specialty="General", experience="3 - 5 years", service_area="Nairobi", verification_status="approved")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["user"]["verification_status"], "pending")
        self.assertEqual(ProviderApplication.objects.get().verification_status, "pending")

    def test_login_accepts_email_and_kenyan_phone(self):
        self.signup()
        self.assertEqual(self.signin(identifier="PATIENT@example.com").status_code, 200)
        self.assertEqual(self.signin(identifier="0712345678").status_code, 200)

    def test_unknown_wrong_password_and_wrong_role_have_same_error(self):
        self.signup()
        responses = [self.signin(password="wrong"), self.signin(identifier="unknown@example.com"), self.signin(role="physiotherapist")]
        self.assertTrue(all(response.status_code == 401 for response in responses))
        self.assertEqual(responses[0].data, responses[1].data)
        self.assertEqual(responses[1].data, responses[2].data)

    def test_rotating_refresh_cannot_be_replayed(self):
        signed_in = self.signup().data
        first = self.client.post("/api/v1/auth/refresh/", {"refresh": signed_in["refresh"]}, format="json")
        self.assertEqual(first.status_code, 200)
        self.assertEqual(self.client.post("/api/v1/auth/refresh/", {"refresh": signed_in["refresh"]}, format="json").status_code, 401)
        self.assertEqual(self.client.post("/api/v1/auth/refresh/", {"refresh": first.data["refresh"]}, format="json").status_code, 200)

    def test_logout_immediately_revokes_access_and_refresh(self):
        tokens = self.signup().data
        self.assertEqual(self.client.post("/api/v1/auth/logout/", {"refresh": tokens["refresh"]}, format="json").status_code, 204)
        self.bearer(tokens["access"])
        self.assertEqual(self.client.get("/api/v1/me/").status_code, 401)
        self.assertEqual(self.client.post("/api/v1/auth/refresh/", {"refresh": tokens["refresh"]}, format="json").status_code, 401)

    def test_logout_does_not_revoke_other_device_session(self):
        first = self.signup().data
        second = self.signin().data
        self.client.post("/api/v1/auth/logout/", {"refresh": first["refresh"]}, format="json")
        self.bearer(second["access"])
        self.assertEqual(self.client.get("/api/v1/me/").status_code, 200)

    def test_suspension_blocks_existing_tokens_and_login(self):
        tokens = self.signup().data
        User.objects.update(account_status="suspended", is_active=False)
        self.bearer(tokens["access"])
        self.assertEqual(self.client.get("/api/v1/me/").status_code, 401)
        self.assertEqual(self.client.post("/api/v1/auth/refresh/", {"refresh": tokens["refresh"]}, format="json").status_code, 401)
        self.assertEqual(self.signin().status_code, 401)

    def test_password_change_invalidates_access_and_refresh(self):
        tokens = self.signup().data
        user = User.objects.get()
        user.set_password("ChangedCare2026!")
        user.save()
        self.bearer(tokens["access"])
        self.assertEqual(self.client.get("/api/v1/me/").status_code, 401)
        self.assertEqual(self.client.post("/api/v1/auth/refresh/", {"refresh": tokens["refresh"]}, format="json").status_code, 401)

    def test_cookie_transport_requires_csrf_and_hides_refresh_from_json(self):
        browser = APIClient(enforce_csrf_checks=True)
        data = registration(transport="cookie")
        self.assertEqual(browser.post("/api/v1/auth/register/", data, format="json").status_code, 403)
        csrf = browser.get("/api/v1/auth/csrf/").data["csrfToken"]
        response = browser.post("/api/v1/auth/register/", data, format="json", HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(response.status_code, 201)
        self.assertNotIn("refresh", response.data)
        self.assertTrue(response.cookies["physiohome_refresh"]["httponly"])
        self.assertEqual(browser.post("/api/v1/auth/refresh/", {}, format="json").status_code, 403)
        refresh = browser.post("/api/v1/auth/refresh/", {}, format="json", HTTP_X_CSRFTOKEN=csrf)
        self.assertEqual(refresh.status_code, 200)
        self.assertNotIn("refresh", refresh.data)
        self.assertEqual(browser.post("/api/v1/auth/logout/", {}, format="json").status_code, 403)
        self.assertEqual(browser.post("/api/v1/auth/logout/", {}, format="json", HTTP_X_CSRFTOKEN=csrf).status_code, 204)

    def test_non_object_auth_payloads_return_validation_errors(self):
        for endpoint in ["register", "login", "refresh", "logout"]:
            response = self.client.post(f"/api/v1/auth/{endpoint}/", [], format="json")
            self.assertEqual(response.status_code, 400)

    def test_expired_refresh_and_malformed_session_id_are_rejected(self):
        from rest_framework_simplejwt.tokens import RefreshToken
        tokens = self.signup().data
        expired = RefreshToken(tokens["refresh"])
        expired["exp"] = 1
        self.assertEqual(self.client.post("/api/v1/auth/refresh/", {"refresh": str(expired)}, format="json").status_code, 401)
        malformed = RefreshToken(tokens["refresh"]).access_token
        malformed["sid"] = "invalid-uuid"
        self.bearer(str(malformed))
        self.assertEqual(self.client.get("/api/v1/me/").status_code, 401)

    def test_login_throttling_limits_repeated_failures(self):
        responses = [self.signin() for _ in range(11)]
        self.assertEqual(responses[-1].status_code, 429)

    def test_reset_password_cannot_exceed_the_login_password_limit(self):
        from .views import RevokeSessionsSetPasswordForm
        user = User.objects.create_user(username="recovery", password=PASSWORD)
        oversized = "LongCare2026!" * 12
        form = RevokeSessionsSetPasswordForm(user, {"new_password1": oversized, "new_password2": oversized})
        self.assertFalse(form.is_valid())

    def test_password_reset_is_generic_and_complete_flow_revokes_sessions(self):
        tokens = self.signup().data
        known = self.client.post("/api/v1/auth/password-reset/", {"email": "patient@example.com"}, format="json")
        unknown = self.client.post("/api/v1/auth/password-reset/", {"email": "nobody@example.com"}, format="json")
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(len(mail.outbox), 1)
        link = re.search(r"http://[^\s]+/auth/reset/[^\s]+", mail.outbox[0].body).group()
        initial = self.client.get(urlsplit(link).path)
        self.assertEqual(initial.status_code, 302)
        form_path = initial.url
        reset = self.client.post(form_path, {"new_password1": "NewSafeCare2026!", "new_password2": "NewSafeCare2026!"})
        self.assertEqual(reset.status_code, 302)
        self.assertTrue(User.objects.get().check_password("NewSafeCare2026!"))
        self.assertIsNotNone(AuthSession.objects.get().revoked_at)
        self.bearer(tokens["access"])
        self.assertEqual(self.client.get("/api/v1/me/").status_code, 401)
        self.assertEqual(self.signin(password="NewSafeCare2026!").status_code, 200)
        repeated = self.client.get(urlsplit(link).path)
        self.assertFalse(repeated.context["validlink"])

    def test_staff_patient_cannot_access_django_admin(self):
        user = User.objects.create_user(username="staff-patient", password=PASSWORD, is_staff=True)
        self.client.force_login(user)
        self.assertEqual(self.client.get("/admin/").status_code, 302)


class PermissionTests(TestCase):
    def setUp(self):
        self.patient = User.objects.create_user(username="patient")
        self.provider = User.objects.create_user(username="provider", role="physiotherapist")
        self.application = ProviderApplication.objects.create(user=self.provider, license_number="TEST", specialty="General", experience="1 year", service_area="Nairobi")

    def allowed(self, permission, user):
        class ProtectedView(APIView):
            permission_classes = [permission]

            def get(self, request):
                return Response({"ok": True})
        request = APIRequestFactory().get("/")
        force_authenticate(request, user=user)
        return ProtectedView.as_view()(request).status_code

    def test_patient_and_provider_roles_are_separate(self):
        self.assertEqual(self.allowed(IsPatient, self.patient), 200)
        self.assertEqual(self.allowed(IsPatient, self.provider), 403)
        self.assertEqual(self.allowed(IsApprovedPhysiotherapist, self.patient), 403)

    def test_approval_is_checked_from_database_on_every_request(self):
        self.assertEqual(self.allowed(IsApprovedPhysiotherapist, self.provider), 403)
        self.application.verification_status = "approved"
        self.application.save()
        self.assertEqual(self.allowed(IsApprovedPhysiotherapist, self.provider), 200)
        self.application.verification_status = "suspended"
        self.application.save()
        self.assertEqual(self.allowed(IsApprovedPhysiotherapist, self.provider), 403)

    def test_admin_approval_requires_note_and_records_audit_entry(self):
        from django.contrib.admin.models import LogEntry
        administrator = User.objects.create_superuser(username="reviewer", password=PASSWORD)
        client = APIClient()
        client.force_login(administrator)
        path = "/admin/accounts/providerapplication/"
        action = {"action": "approve", "_selected_action": [str(self.application.pk)]}
        self.assertEqual(client.post(path, action).status_code, 302)
        self.application.refresh_from_db()
        self.assertEqual(self.application.verification_status, "pending")
        self.application.review_note = "Manual professional credential checks completed."
        self.application.save()
        self.assertEqual(client.post(path, action).status_code, 302)
        self.application.refresh_from_db()
        self.assertEqual(self.application.verification_status, "approved")
        self.assertEqual(self.application.reviewed_by, administrator)
        self.assertIsNotNone(self.application.reviewed_at)
        log = LogEntry.objects.get(object_id=str(self.application.pk))
        self.assertIn("pending -> approved", log.change_message)
        self.assertEqual(log.user, administrator)

    def test_owner_permission_rejects_other_accounts(self):
        request = APIRequestFactory().get("/")
        request.user = self.patient
        self.assertTrue(IsAccountOwner().has_object_permission(request, None, self.patient))
        self.assertFalse(IsAccountOwner().has_object_permission(request, None, self.provider))

    def test_admin_permission_requires_admin_role_and_staff(self):
        self.patient.is_staff = True
        self.patient.save()
        self.assertEqual(self.allowed(IsPlatformAdmin, self.patient), 403)
        administrator = User.objects.create_superuser(username="admin", password=PASSWORD)
        self.assertEqual(self.allowed(IsPlatformAdmin, administrator), 200)


class RefreshConcurrencyTests(TransactionTestCase):
    def test_only_one_concurrent_refresh_can_use_the_same_token(self):
        cache.clear()
        response = APIClient().post("/api/v1/auth/register/", registration(), format="json")
        token = response.data["refresh"]
        def rotate(_):
            close_old_connections()
            try:
                return APIClient().post("/api/v1/auth/refresh/", {"refresh": token}, format="json").status_code
            finally:
                connections.close_all()
        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertEqual(sorted(pool.map(rotate, range(2))), [200, 401])
