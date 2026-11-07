from datetime import timedelta

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from .models import Booking, Notification, Offer
from .tests import make_provider, payload


class PatientToolsTests(TestCase):
    def setUp(self):
        cache.clear()
        self.patient = User.objects.create_user(username="contact-patient", full_name="Contact Patient", phone="+254712345678", email="patient.contact@example.test")
        self.client = APIClient()
        self.client.force_authenticate(self.patient)

    def create(self, **changes):
        return self.client.post("/api/v1/bookings/", payload(**changes), format="json")

    def test_notification_bell_returns_real_updates_without_poll_duplicates(self):
        self.assertEqual(self.client.get("/api/v1/notifications/").data["unread_count"], 0)
        self.assertEqual(self.create().status_code, 201)
        response = self.client.get("/api/v1/notifications/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["unread_count"], 2)
        self.assertEqual(set(Notification.objects.values_list("kind", flat=True)), {"created", "no_match"})
        for _ in range(2):
            self.client.get("/api/v1/bookings/")
            self.client.get("/api/v1/notifications/")
        self.assertEqual(Notification.objects.count(), 2)

    def test_notification_ownership_and_read_state(self):
        self.create()
        item = Notification.objects.first()
        other = User.objects.create_user(username="other-patient")
        self.client.force_authenticate(other)
        self.assertEqual(self.client.get("/api/v1/notifications/").data["notifications"], [])
        self.assertEqual(self.client.post("/api/v1/notifications/read/", {"id": item.pk}, format="json").status_code, 404)
        item.refresh_from_db()
        self.assertIsNone(item.read_at)
        self.client.force_authenticate(self.patient)
        response = self.client.post("/api/v1/notifications/read/", {"id": item.pk}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["unread_count"], 1)
        self.assertEqual(self.client.post("/api/v1/notifications/read/", {"all": True}, format="json").data["unread_count"], 0)

    def test_provider_cannot_read_patient_notification_endpoint(self):
        self.create()
        provider = make_provider("provider")
        self.client.force_authenticate(provider)
        self.assertEqual(self.client.get("/api/v1/notifications/").status_code, 403)

    def test_contacts_are_disclosed_only_to_the_assigned_provider_after_acceptance(self):
        first = make_provider("assigned")
        second = make_provider("other-provider")
        self.create()
        self.client.force_authenticate(first)
        preview = self.client.get("/api/v1/provider/offers/").data["offers"][0]["booking"]
        self.assertNotIn("patient_contact", preview)
        self.assertNotIn("location", preview)
        offer = Offer.objects.get(provider=first)
        accepted = self.client.post(f"/api/v1/provider/offers/{offer.pk}/accept/", {}, format="json")
        self.assertEqual(accepted.status_code, 200, accepted.data)
        self.assertEqual(accepted.data["patient_contact"], {"full_name": "Contact Patient", "phone": "+254712345678", "email": "patient.contact@example.test"})
        self.client.force_authenticate(second)
        response = self.client.get("/api/v1/provider/offers/")
        self.assertEqual(response.data["appointments"], [])
        self.assertNotIn(self.patient.email, str(response.data))
        self.assertEqual(Notification.objects.filter(kind="accepted").count(), 1)
        self.client.force_authenticate(first)
        cancelled = self.client.post(f"/api/v1/bookings/{offer.booking_id}/cancel/", {}, format="json")
        self.assertNotIn("patient_contact", cancelled.data)
        self.assertNotIn("location", cancelled.data)
        self.assertEqual(Notification.objects.filter(kind="cancelled").count(), 1)

    def test_notification_poll_expires_an_old_search(self):
        make_provider("provider")
        self.create()
        Booking.objects.update(search_expires_at=timezone.now()-timedelta(seconds=1))
        self.client.get("/api/v1/notifications/")
        self.assertEqual(Booking.objects.get().status, "expired")
        self.assertEqual(Notification.objects.filter(kind="expired").count(), 1)
        self.client.get("/api/v1/notifications/")
        self.assertEqual(Notification.objects.filter(kind="expired").count(), 1)

    def test_scheduled_only_provider_receives_future_appointment(self):
        provider = make_provider("scheduled-provider", mode="scheduled_only")
        starts = (timezone.now()+timedelta(days=1)).replace(second=0, microsecond=0)
        response = self.create(starts_at=starts.isoformat())
        self.assertEqual(response.status_code, 201, response.data)
        self.assertTrue(response.data["scheduled"])
        booking = Booking.objects.get()
        self.assertEqual(booking.starts_at, starts)
        self.assertEqual(booking.ends_at-booking.starts_at, timedelta(minutes=60))
        self.assertEqual(Offer.objects.get().provider, provider)

    def test_invalid_past_and_far_future_schedules_are_rejected(self):
        for starts in ["not-a-date", "2026-02-30T10:00:00+03:00", (timezone.now()-timedelta(minutes=1)).isoformat(), (timezone.now()+timedelta(days=91)).isoformat()]:
            self.assertEqual(self.create(starts_at=starts).status_code, 400)
        self.assertFalse(Booking.objects.exists())
        self.assertFalse(Notification.objects.exists())

    def test_symptom_search_finds_related_services_and_handles_no_match(self):
        response = self.client.post("/api/v1/services/search/", {"query": "lower back pain"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["services"][0]["code"], "spine")
        response = self.client.post("/api/v1/services/search/", {"query": "knee pain"}, format="json")
        self.assertEqual(response.data["services"][0]["code"], "knee")
        response = self.client.post("/api/v1/services/search/", {"query": "zzzzzz"}, format="json")
        self.assertEqual(response.data["services"], [])
        self.assertEqual(self.client.post("/api/v1/services/search/", {"query": "a"}, format="json").status_code, 400)
