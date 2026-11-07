import base64
import io
import tempfile
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from unittest.mock import patch

from django.contrib.gis.geos import Point
from django.core.cache import cache
from django.core.management import call_command
from django.db import connections
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User, AuthSession
from .models import Booking, BookingEvent, Message, PatientProfile, PushDevice, PushDelivery, Review
from .notifications import create_notification
from .tests import make_provider, payload
from .matching import accept_offer


class PatientFeatureTests(TestCase):
    def setUp(self):
        cache.clear()
        self.patient = User.objects.create_user(username="features", password="SafePassword2026!", full_name="Patient Feature", email="features@example.test", phone="+254712345678")
        self.provider = make_provider("clinician")
        self.other = User.objects.create_user(username="unrelated", role="patient")
        self.client = APIClient()
        self.client.force_authenticate(self.patient)
        self.media = tempfile.TemporaryDirectory()
        self.settings = override_settings(MEDIA_ROOT=self.media.name)
        self.settings.enable()
        self.addCleanup(self.media.cleanup)
        self.addCleanup(self.settings.disable)

    def book(self, starts=None):
        response = self.client.post("/api/v1/bookings/", payload(**({"starts_at": starts.isoformat()} if starts else {})), format="json")
        self.assertEqual(response.status_code, 201, response.data)
        booking = Booking.objects.get(pk=response.data["id"])
        accept_offer(self.provider, booking.offers.get(provider=self.provider).pk)
        booking.refresh_from_db()
        return booking

    def test_profile_persists_real_details_and_requires_password_for_contact_changes(self):
        response = self.client.get("/api/v1/patient/profile/")
        self.assertEqual(response.data["counts"], {"active": 0, "completed": 0, "locations": 0})
        data = {"full_name": "Updated Patient", "email": self.patient.email, "phone": self.patient.phone, "mobility_needs": "Uses a walking aid", "emergency_name": "Trusted Contact", "emergency_phone": "0712345679", "current_password": ""}
        response = self.client.post("/api/v1/patient/profile/", data, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["profile"]["emergency_phone"], "+254712345679")
        data["phone"] = "+254712345680"
        self.assertEqual(self.client.post("/api/v1/patient/profile/", data, format="json").status_code, 400)
        data["current_password"] = "SafePassword2026!"
        self.assertEqual(self.client.post("/api/v1/patient/profile/", data, format="json").status_code, 200)
        data["email"] = "not-an-email"
        self.assertEqual(self.client.post("/api/v1/patient/profile/", data, format="json").status_code, 400)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get("/api/v1/patient/profile/").data["profile"]["emergency_name"], "")

    def test_saved_pins_are_owner_scoped_and_removable(self):
        pin = {"label": "Home", "latitude": -1.2921, "longitude": 36.8219}
        response = self.client.post("/api/v1/patient/locations/", pin, format="json")
        self.assertEqual(response.status_code, 200)
        pk = response.data["locations"][0]["id"]
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get("/api/v1/patient/locations/").data["locations"], [])
        self.assertEqual(self.client.post("/api/v1/patient/locations/", {**pin, "id": pk, "delete": True}, format="json").status_code, 404)
        self.client.force_authenticate(self.patient)
        self.assertEqual(self.client.post("/api/v1/patient/locations/", {**pin, "id": pk, "delete": True}, format="json").data["locations"], [])

    def test_appointment_progress_order_permissions_and_single_review(self):
        booking = self.book()
        endpoint = f"/api/v1/bookings/{booking.pk}/progress/"
        self.assertEqual(self.client.post(endpoint+"en_route/", {}, format="json").status_code, 404)
        self.client.force_authenticate(self.provider)
        self.assertEqual(self.client.post(endpoint+"completed/", {}, format="json").status_code, 400)
        for step in ["en_route", "arrived", "in_progress", "completed"]:
            response = self.client.post(endpoint+step+"/", {}, format="json")
            self.assertEqual(response.status_code, 200, response.data)
            self.assertEqual(response.data["status"], step)
            if step == "completed":
                self.assertNotIn("patient_contact", response.data)
                self.assertNotIn("location", response.data)
        self.assertEqual(self.client.post(endpoint+"completed/", {}, format="json").status_code, 200)
        self.assertEqual(BookingEvent.objects.filter(booking=booking, action="completed").count(), 1)
        self.client.force_authenticate(self.patient)
        response = self.client.post(f"/api/v1/bookings/{booking.pk}/review/", {"rating": 5, "comment": "Helpful session"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.client.get("/api/v1/patient/profile/").data["counts"]["completed"], 1)
        self.assertEqual(self.client.post(f"/api/v1/bookings/{booking.pk}/review/", {"rating": 4}, format="json").status_code, 400)
        self.assertEqual(Review.objects.count(), 1)

    def test_future_progress_and_premature_review_are_rejected(self):
        booking = self.book(timezone.now()+timedelta(days=1))
        self.assertEqual(self.client.post(f"/api/v1/bookings/{booking.pk}/review/", {"rating": 5}, format="json").status_code, 400)
        self.client.force_authenticate(self.provider)
        self.assertEqual(self.client.post(f"/api/v1/bookings/{booking.pk}/progress/en_route/", {}, format="json").status_code, 400)

    def test_reschedule_requires_provider_approval_and_rejects_conflicts(self):
        booking = self.book(timezone.now()+timedelta(hours=1))
        proposed = timezone.now()+timedelta(days=1)
        response = self.client.post(f"/api/v1/bookings/{booking.pk}/reschedule/", {"starts_at": proposed.isoformat()}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertNotEqual(response.data["starts_at"], proposed)
        original = booking.starts_at
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.post(f"/api/v1/bookings/{booking.pk}/reschedule/accept/", {}, format="json").status_code, 404)
        self.client.force_authenticate(self.provider)
        response = self.client.post(f"/api/v1/bookings/{booking.pk}/reschedule/accept/", {}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        booking.refresh_from_db()
        self.assertEqual(booking.starts_at, proposed)
        self.assertNotEqual(booking.starts_at, original)
        self.assertEqual(booking.ends_at-booking.starts_at, timedelta(hours=1))
        self.client.force_authenticate(self.patient)
        conflict_time = proposed+timedelta(days=1)
        Booking.objects.create(patient=self.other, provider=self.provider, specialty="general", services=["general"], location=Point(36.8219,-1.2921), area_label="Test", starts_at=conflict_time, ends_at=conflict_time+timedelta(hours=1), search_expires_at=timezone.now(), status="arrived")
        self.client.post(f"/api/v1/bookings/{booking.pk}/reschedule/", {"starts_at": conflict_time.isoformat()}, format="json")
        self.client.force_authenticate(self.provider)
        self.assertEqual(self.client.post(f"/api/v1/bookings/{booking.pk}/reschedule/accept/", {}, format="json").status_code, 400)
        booking.refresh_from_db()
        self.assertEqual(booking.starts_at, proposed)

    def test_chat_and_attachments_are_private_idempotent_and_searchable(self):
        booking = self.book()
        endpoint = f"/api/v1/bookings/{booking.pk}/messages/"
        data = {"client_id": str(uuid.uuid4()), "text": "Appointment question", "filename": "report.html", "content": base64.b64encode(b"%PDF-1.4\nTest file").decode()}
        response = self.client.post(endpoint, data, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        pk = response.data["id"]
        self.assertEqual(self.client.post(endpoint, data, format="json").status_code, 200)
        self.assertEqual(Message.objects.count(), 1)
        self.assertEqual(response.data["attachment"]["name"], "report.pdf")
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get("/api/v1/conversations/").data["conversations"], [])
        self.assertEqual(self.client.get(endpoint).status_code, 404)
        self.assertEqual(self.client.get(endpoint+pk+"/attachment/").status_code, 404)
        self.client.force_authenticate(self.provider)
        self.assertEqual(self.client.get("/api/v1/conversations/").data["conversations"][0]["unread"], 1)
        self.assertIsNotNone(self.client.get(endpoint).data["messages"][0]["read_at"])
        attachment = self.client.get(endpoint+pk+"/attachment/")
        self.assertEqual(attachment["Cache-Control"], "no-store")
        self.assertEqual(attachment.data["content"], data["content"])
        self.assertEqual(len(self.client.post(endpoint+"search/", {"query": "question"}, format="json").data["messages"]), 1)
        self.assertEqual(self.client.post(endpoint+"search/", {"query": "absent"}, format="json").data["messages"], [])
        data.update(client_id=str(uuid.uuid4()), text="Reply", content=base64.b64encode(b"<html>not a pdf</html>").decode())
        self.assertEqual(self.client.post(endpoint, data, format="json").status_code, 400)
        data.pop("content")
        self.assertEqual(self.client.post(endpoint, data, format="json").status_code, 201)
        self.assertTrue(booking.notifications.filter(title="New appointment message").exists())
        self.client.force_authenticate(self.patient)
        self.client.post(f"/api/v1/bookings/{booking.pk}/cancel/", {}, format="json")
        data["client_id"] = str(uuid.uuid4())
        self.assertEqual(self.client.post(endpoint, data, format="json").status_code, 400)
        self.assertEqual(self.client.get(endpoint).status_code, 200)
        self.assertFalse(self.client.get(endpoint).data["can_send"])

    def test_chat_pagination_and_support_ownership(self):
        booking = self.book()
        Message.objects.bulk_create([Message(booking=booking, sender=self.patient, client_id=uuid.uuid4(), text=str(i)) for i in range(55)])
        url = f"/api/v1/bookings/{booking.pk}/messages/"
        first = self.client.get(url).data
        self.assertEqual(len(first["messages"]), 50)
        second = self.client.get(url+"?before="+first["next_before"]).data
        self.assertEqual(len(second["messages"]), 5)
        self.assertFalse({x["id"] for x in first["messages"]} & {x["id"] for x in second["messages"]})
        self.assertIsNone(second["next_before"])
        self.assertEqual(self.client.post("/api/v1/patient/support/", {"subject": "Booking help", "body": "Please review my request"}, format="json").status_code, 200)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get("/api/v1/patient/support/").data["tickets"], [])

    def test_password_change_revokes_sessions_and_requires_current_password(self):
        session = AuthSession.objects.create(user=self.patient, refresh_jti="test", expires_at=timezone.now()+timedelta(days=1))
        endpoint = "/api/v1/patient/password/"
        self.assertEqual(self.client.post(endpoint, {"current_password": "wrong", "new_password": "NewSafePassword2026!"}, format="json").status_code, 400)
        self.assertEqual(self.client.post(endpoint, {"current_password": "SafePassword2026!", "new_password": "NewSafePassword2026!"}, format="json").status_code, 200)
        session.refresh_from_db()
        self.assertIsNotNone(session.revoked_at)
        self.patient.refresh_from_db()
        self.assertTrue(self.patient.check_password("NewSafePassword2026!"))

    @override_settings(EXPO_PUSH_ENABLED=True)
    def test_push_outbox_opt_in_receipts_and_revoked_session_privacy(self):
        booking = self.book()
        profile, _ = PatientProfile.objects.get_or_create(user=self.patient)
        profile.push_enabled = True
        profile.save()
        session = AuthSession.objects.create(user=self.patient, refresh_jti="test", expires_at=timezone.now()+timedelta(days=1))
        device = PushDevice.objects.create(user=self.patient, session=session, token="ExpoPushToken[testtoken]")
        create_notification(booking, "testpush", "Private title", "Private clinical content")
        self.assertEqual(PushDelivery.objects.count(), 1)
        PushDelivery.objects.update(updated_at=timezone.now()-timedelta(minutes=1))
        with patch("apps.marketplace.management.commands.deliver_push.expo_request", return_value={"status": "ok", "id": "ticket1"}) as send:
            call_command("deliver_push", stdout=io.StringIO())
            self.assertNotIn("Private", str(send.call_args))
        delivery = PushDelivery.objects.get()
        self.assertEqual(delivery.status, "sent")
        PushDelivery.objects.update(updated_at=timezone.now()-timedelta(minutes=16))
        with patch("apps.marketplace.management.commands.deliver_push.expo_request", return_value={"ticket1": {"status": "error", "details": {"error": "DeviceNotRegistered"}}}):
            with self.captureOnCommitCallbacks(execute=True):
                call_command("deliver_push", stdout=io.StringIO())
        device.refresh_from_db()
        self.assertFalse(device.active)
        device.active = True
        device.save()
        create_notification(booking, "testpush2", "Another", "Private")
        session.revoked_at = timezone.now()
        session.save()
        PushDelivery.objects.filter(status="queued").update(updated_at=timezone.now()-timedelta(minutes=1))
        with patch("apps.marketplace.management.commands.deliver_push.expo_request") as send:
            call_command("deliver_push", stdout=io.StringIO())
            send.assert_not_called()
        self.assertTrue(PushDelivery.objects.filter(status="skipped").exists())


    def test_push_registration_is_session_bound_and_account_switch_discards_old_queue(self):
        booking = self.book()
        old_session = AuthSession.objects.create(user=self.patient, refresh_jti="old", expires_at=timezone.now()+timedelta(days=1))
        self.client.force_authenticate(self.patient, token={"sid": str(old_session.pk)})
        data = {"enabled": True, "token": "ExpoPushToken[fixture-device]"}
        self.assertEqual(self.client.post("/api/v1/patient/push/", data, format="json").status_code, 200)
        create_notification(booking, "before-switch", "Title", "Body")
        self.assertEqual(PushDelivery.objects.get().status, "queued")
        self.assertEqual(self.client.post("/api/v1/patient/push/", data, format="json").status_code, 200)
        self.assertEqual(PushDelivery.objects.get().status, "queued")
        next_session = AuthSession.objects.create(user=self.other, refresh_jti="next", expires_at=timezone.now()+timedelta(days=1))
        self.client.force_authenticate(self.other, token={"sid": str(next_session.pk)})
        self.assertEqual(self.client.post("/api/v1/patient/push/", data, format="json").status_code, 200)
        device = PushDevice.objects.get()
        self.assertEqual(device.user_id, self.other.pk)
        self.assertEqual(device.session_id, next_session.pk)
        self.assertEqual(PushDelivery.objects.get().status, "skipped")
        self.assertEqual(self.client.post("/api/v1/patient/push/", {"enabled": False}, format="json").status_code, 200)
        device.refresh_from_db()
        self.assertFalse(device.active)
        self.client.force_authenticate(self.patient)
        self.assertEqual(self.client.post("/api/v1/patient/push/", data, format="json").status_code, 400)



class RescheduleRaceTests(TransactionTestCase):
    def test_acceptance_and_reschedule_cannot_reserve_overlapping_slots(self):
        cache.clear()
        provider = make_provider("race-physio")
        first = User.objects.create_user(username="race-first", role="patient")
        second = User.objects.create_user(username="race-second", role="patient")
        starts = timezone.now()+timedelta(days=1)
        client = APIClient()
        client.force_authenticate(first)
        original = client.post("/api/v1/bookings/", payload(starts_at=(starts+timedelta(days=1)).isoformat()), format="json")
        booking = Booking.objects.get(pk=original.data["id"])
        accept_offer(provider, booking.offers.get().pk)
        self.assertEqual(client.post(f"/api/v1/bookings/{booking.pk}/reschedule/", {"starts_at": starts.isoformat()}, format="json").status_code, 200)
        client.force_authenticate(second)
        other_response = client.post("/api/v1/bookings/", payload(starts_at=starts.isoformat()), format="json")
        other = Booking.objects.get(pk=other_response.data["id"])
        offer_id = other.offers.get().pk

        def attempt(kind):
            try:
                own = APIClient()
                own.force_authenticate(User.objects.get(pk=provider.pk))
                path = f"/api/v1/bookings/{booking.pk}/reschedule/accept/" if kind == "reschedule" else f"/api/v1/provider/offers/{offer_id}/accept/"
                return own.post(path, {}, format="json").status_code
            finally:
                connections.close_all()

        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(attempt, ["reschedule", "accept"]))
        self.assertEqual(sorted(results), [200, 400])
        self.assertEqual(Booking.objects.filter(provider=provider, status="payment_pending", starts_at=starts).count(), 1)


class PatientWorkerTests(TransactionTestCase):
    @override_settings(EXPO_PUSH_ENABLED=False)
    def test_worker_expires_search_without_a_patient_poll(self):
        cache.clear()
        patient = User.objects.create_user(username="worker-patient")
        make_provider("worker-provider")
        self.client = APIClient()
        self.client.force_authenticate(patient)
        response = self.client.post("/api/v1/bookings/", payload(), format="json")
        Booking.objects.filter(pk=response.data["id"]).update(search_expires_at=timezone.now()-timedelta(minutes=1))
        with patch("apps.marketplace.management.commands.deliver_push.expo_request") as send:
            call_command("patient_worker", once=True, stdout=io.StringIO())
            send.assert_not_called()
        booking = Booking.objects.get(pk=response.data["id"])
        self.assertEqual(booking.status, "expired")
        self.assertTrue(booking.notifications.filter(kind="expired").exists())
