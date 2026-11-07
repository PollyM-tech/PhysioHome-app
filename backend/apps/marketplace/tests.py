from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from unittest.mock import patch

from django.contrib.gis.geos import Point
from django.core.cache import cache
from django.db import connections
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import ProviderApplication, User
from .matching import accept_offer
from .catalog import SPECIALTIES
from .models import Booking, Coverage, Offer


def make_provider(name, mode="available_now", radius=10, longitude=36.8219, specialty="General Physiotherapy", approved=True):
    user = User.objects.create_user(username=name, full_name=name, role="physiotherapist")
    ProviderApplication.objects.create(user=user, license_number="TEST", specialty=specialty, services=[next(code for code, label in SPECIALTIES.items() if label == specialty)], experience="3 - 5 years", service_area="Test area", pricing_tier="experienced", pricing_reviewed_at=timezone.now(), verification_status="approved" if approved else "pending")
    Coverage.objects.create(user=user, label="Test area", center=Point(longitude, -1.2921, srid=4326), radius_km=radius, availability=mode)
    return user


def payload(**changes):
    return {"expected_fee": 3000, "label": "Private home street and number", "latitude": -1.2921, "longitude": 36.8219, "specialty": "general", "directions": "Private gate code", **changes}


class MatchingTests(TestCase):
    def setUp(self):
        cache.clear()
        self.patient = User.objects.create_user(username="patient", role="patient")
        self.client = APIClient()
        self.client.force_authenticate(self.patient)

    def test_radius_specialty_approval_availability_and_account_status_filtering(self):
        included = make_provider("near")
        make_provider("outside", radius=5, longitude=36.90)
        make_provider("wrong-specialty", specialty="Spine & Back Therapy")
        make_provider("pending", approved=False)
        make_provider("offline", mode="offline")
        make_provider("scheduled", mode="scheduled_only")
        suspended = make_provider("suspended")
        suspended.is_active = False
        suspended.account_status = "suspended"
        suspended.save()
        response = self.client.post("/api/v1/providers/discover/", payload(), format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual([item["id"] for item in response.data["providers"]], [included.pk])
        self.assertNotIn("latitude", response.data["providers"][0])
        self.assertNotIn("email", response.data["providers"][0])

    def test_saved_radius_not_patient_search_radius_controls_coverage(self):
        wider = make_provider("wide", radius=15, longitude=36.90)
        make_provider("narrow", radius=5, longitude=36.90)
        response = self.client.post("/api/v1/providers/discover/", payload(), format="json")
        self.assertEqual([row["id"] for row in response.data["providers"]], [wider.pk])

    def test_scheduled_only_is_not_offered_immediate_visits(self):
        provider = make_provider("scheduled", mode="scheduled_only")
        when = (timezone.now()+timedelta(days=1)).isoformat()
        response = self.client.post("/api/v1/providers/discover/", payload(starts_at=when), format="json")
        self.assertEqual([row["id"] for row in response.data["providers"]], [provider.pk])
        response = self.client.post("/api/v1/bookings/", payload(), format="json")
        self.assertEqual(response.data["status"], "no_match")

    def test_no_providers_returns_honest_no_match_and_legacy_provider_needs_pin(self):
        legacy = make_provider("legacy")
        Coverage.objects.filter(user=legacy).delete()
        response = self.client.post("/api/v1/bookings/", payload(), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "no_match")
        self.assertFalse(Offer.objects.exists())

    def test_offers_do_not_disclose_private_location_before_acceptance(self):
        provider = make_provider("provider")
        self.client.post("/api/v1/bookings/", payload(), format="json")
        self.client.force_authenticate(provider)
        response = self.client.get("/api/v1/provider/offers/")
        preview = response.data["offers"][0]["booking"]
        self.assertNotIn("location", preview)
        self.assertNotIn("directions", preview)
        offer = response.data["offers"][0]["id"]
        accepted = self.client.post(f"/api/v1/provider/offers/{offer}/accept/", {}, format="json")
        self.assertEqual(accepted.status_code, 200, accepted.data)
        self.assertEqual(accepted.data["directions"], "Private gate code")
        self.assertEqual(accepted.data["status"], "payment_pending")

    def test_direct_request_only_offers_selected_provider(self):
        chosen = make_provider("chosen")
        make_provider("other")
        response = self.client.post("/api/v1/bookings/", payload(preferred_provider_id=chosen.pk), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(list(Offer.objects.values_list("provider_id", flat=True)), [chosen.pk])

    def test_deleted_chosen_provider_does_not_silently_switch_to_automatic_matching(self):
        chosen = make_provider("chosen")
        make_provider("other")
        self.client.post("/api/v1/bookings/", payload(preferred_provider_id=chosen.pk), format="json")
        chosen.delete()
        response = self.client.get("/api/v1/bookings/")
        self.assertEqual(response.data["bookings"][0]["status"], "no_match")
        self.assertEqual(response.data["bookings"][0]["booking_mode"], "choose")
        self.assertFalse(Offer.objects.exists())

    def test_direct_request_to_ineligible_provider_is_rejected(self):
        provider = make_provider("wrong", specialty="Spine & Back Therapy")
        response = self.client.post("/api/v1/bookings/", payload(preferred_provider_id=provider.pk), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Booking.objects.exists())

    def test_acceptance_closes_other_offers_and_cannot_be_reassigned(self):
        first = make_provider("first")
        second = make_provider("second")
        self.client.post("/api/v1/bookings/", payload(), format="json")
        offer1 = Offer.objects.get(provider=first)
        offer2 = Offer.objects.get(provider=second)
        accept_offer(first, offer1.pk)
        self.client.force_authenticate(second)
        self.assertEqual(self.client.post(f"/api/v1/provider/offers/{offer2.pk}/accept/", {}, format="json").status_code, 400)
        self.assertEqual(Booking.objects.get().provider, first)

    def test_decline_dispatches_next_group_and_booking_poll_handles_nullable_provider(self):
        for i in range(4): make_provider(f"provider-{i}")
        self.client.post("/api/v1/bookings/", payload(), format="json")
        initial = list(Offer.objects.all())
        self.assertEqual(len(initial), 3)
        for offer in initial:
            self.client.force_authenticate(offer.provider)
            self.assertEqual(self.client.post(f"/api/v1/provider/offers/{offer.pk}/decline/", {}, format="json").status_code, 200)
        self.assertEqual(Offer.objects.filter(status="open").count(), 1)
        self.client.force_authenticate(self.patient)
        response = self.client.get("/api/v1/bookings/")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["bookings"][0]["status"], "searching")

    def test_expired_offer_and_search_cannot_be_accepted(self):
        provider = make_provider("provider")
        self.client.post("/api/v1/bookings/", payload(), format="json")
        Booking.objects.update(search_expires_at=timezone.now()-timedelta(seconds=1))
        self.client.force_authenticate(provider)
        response = self.client.post(f"/api/v1/provider/offers/{Offer.objects.get().pk}/accept/", {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.client.force_authenticate(self.patient)
        self.assertEqual(self.client.get("/api/v1/bookings/").data["bookings"][0]["status"], "expired")

    def test_duplicate_active_search_is_blocked(self):
        make_provider("provider")
        self.assertEqual(self.client.post("/api/v1/bookings/", payload(), format="json").status_code, 201)
        self.assertEqual(self.client.post("/api/v1/bookings/", payload(), format="json").status_code, 400)
        self.assertEqual(Booking.objects.count(), 1)

    def test_overlapping_booking_cannot_be_accepted_and_cancel_releases_reservation(self):
        provider = make_provider("provider")
        self.client.post("/api/v1/bookings/", payload(), format="json")
        booking = accept_offer(provider, Offer.objects.get().pk)
        other = User.objects.create_user(username="patient2")
        self.client.force_authenticate(other)
        self.assertEqual(self.client.post("/api/v1/providers/discover/", payload(), format="json").data["providers"], [])
        self.assertEqual(self.client.post(f"/api/v1/bookings/{booking.pk}/cancel/", {}, format="json").status_code, 403)
        self.client.force_authenticate(self.patient)
        self.assertEqual(self.client.post(f"/api/v1/bookings/{booking.pk}/cancel/", {}, format="json").status_code, 200)
        self.assertEqual(len(self.client.post("/api/v1/providers/discover/", payload(), format="json").data["providers"]), 1)

    def test_pending_provider_can_save_coverage_but_cannot_go_online(self):
        provider = make_provider("pending", approved=False, mode="offline")
        self.client.force_authenticate(provider)
        data = {"label": "Chosen work area", "latitude": -1.3, "longitude": 36.8, "radius_km": 5, "availability": "available_now"}
        self.assertEqual(self.client.post("/api/v1/provider/coverage/", data, format="json").status_code, 403)
        data["availability"] = "offline"
        self.assertEqual(self.client.post("/api/v1/provider/coverage/", data, format="json").status_code, 200)
        self.assertEqual(Coverage.objects.get(user=provider).center.x, 36.8)
        self.assertEqual(self.client.get("/api/v1/provider/offers/").status_code, 403)

    def test_invalid_coordinates_radius_and_patient_coverage_write_rejected(self):
        self.assertEqual(self.client.post("/api/v1/bookings/", payload(latitude=100), format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/v1/bookings/", payload(specialty="unrelated"), format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/v1/provider/coverage/", {}, format="json").status_code, 403)
        provider = make_provider("provider")
        self.client.force_authenticate(provider)
        self.assertEqual(self.client.post("/api/v1/provider/coverage/", {"label": "Test", "latitude": 0, "longitude": 0, "radius_km": 100, "availability": "available_now"}, format="json").status_code, 400)

    @override_settings(GOOGLE_MAPS_API_KEY="")
    def test_search_without_credentials_is_explicitly_limited_and_no_external_request(self):
        with patch("apps.marketplace.locations.urlopen") as outbound:
            response = self.client.get("/api/v1/locations/search/?q=Westlands")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["limited"])
        outbound.assert_not_called()

    def test_going_offline_after_offer_prevents_acceptance(self):
        provider = make_provider("provider")
        self.client.post("/api/v1/bookings/", payload(), format="json")
        Coverage.objects.filter(user=provider).update(availability="offline")
        self.client.force_authenticate(provider)
        self.assertEqual(self.client.post(f"/api/v1/provider/offers/{Offer.objects.get().pk}/accept/", {}, format="json").status_code, 400)


class AcceptanceRaceTests(TransactionTestCase):
    def test_only_one_provider_wins_parallel_acceptance(self):
        patient = User.objects.create_user(username="patient")
        providers = [make_provider("a"), make_provider("b")]
        client = APIClient(); client.force_authenticate(patient)
        client.post("/api/v1/bookings/", payload(), format="json")
        rows = [(offer.provider_id, offer.pk) for offer in Offer.objects.all()]
        def accept(row):
            try:
                user = User.objects.get(pk=row[0])
                c = APIClient(); c.force_authenticate(user)
                return c.post(f"/api/v1/provider/offers/{row[1]}/accept/", {}, format="json").status_code
            finally: connections.close_all()
        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertEqual(sorted(pool.map(accept, rows)), [200, 400])
        self.assertEqual(Offer.objects.filter(status="accepted").count(), 1)

    def test_same_provider_cannot_accept_overlapping_bookings_in_parallel(self):
        provider = make_provider("provider")
        for i in range(2):
            user = User.objects.create_user(username=f"patient{i}")
            client = APIClient(); client.force_authenticate(user)
            client.post("/api/v1/bookings/", payload(), format="json")
        ids = list(Offer.objects.values_list("pk", flat=True))
        def accept(pk):
            try:
                client = APIClient(); client.force_authenticate(User.objects.get(pk=provider.pk))
                return client.post(f"/api/v1/provider/offers/{pk}/accept/", {}, format="json").status_code
            finally: connections.close_all()
        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertEqual(sorted(pool.map(accept, ids)), [200, 400])


class MultiServiceTests(TestCase):
    def setUp(self):
        cache.clear()
        self.patient = User.objects.create_user(username="multi-patient")
        self.client = APIClient()
        self.client.force_authenticate(self.patient)

    def selection(self, services, **changes):
        data = payload(**changes)
        data.pop("specialty", None)
        data["services"] = services
        return data

    def test_empty_four_duplicate_and_unknown_services_rejected(self):
        for selection in [[], ["spine", "sports", "knee", "general"], ["spine", "spine"], ["unknown"]]:
            data = self.selection(selection)
            self.assertEqual(self.client.post("/api/v1/providers/discover/", data, format="json").status_code, 400)
            self.assertEqual(self.client.post("/api/v1/bookings/", data, format="json").status_code, 400)
        self.assertFalse(Booking.objects.exists())

    def test_discovery_and_dispatch_require_all_selected_services(self):
        complete = make_provider("complete")
        partial = make_provider("partial")
        ProviderApplication.objects.filter(user=complete).update(services=["spine", "sports", "general"])
        ProviderApplication.objects.filter(user=partial).update(services=["spine"])
        data = self.selection(["spine", "sports"])
        discovered = self.client.post("/api/v1/providers/discover/", data, format="json")
        self.assertEqual(discovered.status_code, 200, discovered.data)
        self.assertEqual([item["id"] for item in discovered.data["providers"]], [complete.pk])
        created = self.client.post("/api/v1/bookings/", data, format="json")
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(created.data["services"], ["spine", "sports"])
        self.assertEqual(created.data["service_labels"], [SPECIALTIES["spine"], SPECIALTIES["sports"]])
        self.assertEqual(list(Offer.objects.values_list("provider_id", flat=True)), [complete.pk])

    def test_direct_provider_with_partial_services_is_rejected(self):
        provider = make_provider("partial")
        ProviderApplication.objects.filter(user=provider).update(services=["spine"])
        response = self.client.post("/api/v1/bookings/", self.selection(["spine", "sports"], preferred_provider_id=provider.pk), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Booking.objects.exists())

    def test_acceptance_rechecks_all_services(self):
        provider = make_provider("complete")
        ProviderApplication.objects.filter(user=provider).update(services=["spine", "sports"])
        self.client.post("/api/v1/bookings/", self.selection(["spine", "sports"]), format="json")
        offer = Offer.objects.get(provider=provider)
        ProviderApplication.objects.filter(user=provider).update(services=["spine"])
        self.client.force_authenticate(provider)
        response = self.client.post(f"/api/v1/provider/offers/{offer.pk}/accept/", {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIsNone(Booking.objects.get().provider_id)

    def provider_data(self, services):
        return {"full_name": "Registered Provider", "email": "multi-provider@example.test", "phone": "+254712345678", "password": "SafeCare2026!", "role": "physiotherapist", "agreed_to_terms": True,
                "license_number": "TEST-ONLY", "services": services, "experience": "3 - 5 years",
                "coverage": {"label": "Nairobi", "latitude": -1.2921, "longitude": 36.8219, "radius_km": 10}}

    def test_registration_saves_three_services_and_starts_offline(self):
        self.client.force_authenticate(None)
        selected = ["spine", "sports", "knee"]
        response = self.client.post("/api/v1/auth/register/", self.provider_data(selected), format="json")
        self.assertEqual(response.status_code, 201, response.data)
        application = ProviderApplication.objects.get()
        self.assertEqual(application.services, selected)
        self.assertEqual(application.specialty, SPECIALTIES["spine"])
        self.assertEqual(application.verification_status, "pending")
        self.assertEqual(Coverage.objects.get().availability, "offline")

    def test_registration_rejects_invalid_service_selections(self):
        self.client.force_authenticate(None)
        for selected in [[], ["spine", "sports", "knee", "general"], ["spine", "spine"], ["unknown"]]:
            response = self.client.post("/api/v1/auth/register/", self.provider_data(selected), format="json")
            self.assertEqual(response.status_code, 400, response.data)
        self.assertFalse(ProviderApplication.objects.exists())

    def test_legacy_single_service_request_still_populates_services_array(self):
        make_provider("general")
        response = self.client.post("/api/v1/bookings/", payload(), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["services"], ["general"])
