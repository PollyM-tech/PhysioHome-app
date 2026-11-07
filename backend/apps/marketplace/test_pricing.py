from django.core.cache import cache
from django.core.exceptions import ValidationError as ModelError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from .models import Booking
from .tests import make_provider, payload
from .matching import accept_offer
from .pricing import session_fee

class PricingTests(TestCase):
    def setUp(self):
        cache.clear()
        self.patient=User.objects.create_user(username="price-patient")
        self.client=APIClient()
        self.client.force_authenticate(self.patient)

    def test_rates_require_review_and_consultants_require_an_exact_valid_rate(self):
        application=make_provider("rates").provider_application
        for tier,expected in [("early",2000),("experienced",3000),("senior",3500),("consultant",4200)]:
            application.pricing_tier=tier
            application.consultant_fee=4200 if tier=="consultant" else None
            self.assertEqual(session_fee(application),expected)
        application.pricing_reviewed_at=None
        self.assertIsNone(session_fee(application))
        application.pricing_reviewed_at=timezone.now()
        application.review_note="Credentials reviewed for test fixture"
        application.consultant_fee=5000
        with self.assertRaises(ModelError):
            application.clean()

    def test_discovery_and_dispatch_respect_budget_and_exclude_unreviewed_prices(self):
        low=make_provider("low")
        application=low.provider_application
        application.pricing_tier="early"
        application.save()
        make_provider("higher")
        pending=make_provider("unpriced").provider_application
        pending.pricing_reviewed_at=None
        pending.save()
        response=self.client.post("/api/v1/providers/discover/",payload(max_fee=2000),format="json")
        self.assertEqual(response.status_code,200,response.data)
        self.assertEqual([(x["id"],x["session_fee"]) for x in response.data["providers"]],[(low.pk,2000)])
        response=self.client.post("/api/v1/bookings/",payload(max_fee=2000),format="json")
        booking=Booking.objects.get(pk=response.data["id"])
        self.assertEqual(list(booking.offers.values_list("provider_id",flat=True)),[low.pk])
        self.assertEqual(booking.offers.get().quoted_fee,2000)
        # A later rate update never raises the price of an already-issued offer.
        application.pricing_tier="senior"
        application.save()
        accepted=accept_offer(low,booking.offers.get().pk)
        self.assertEqual(accepted.quoted_fee,2000)
        self.assertEqual(accepted.max_fee,2000)

    def test_direct_requests_reject_stale_prices_and_freeze_the_accepted_quote(self):
        provider=make_provider("chosen-price")
        response=self.client.post("/api/v1/bookings/",payload(preferred_provider_id=provider.pk,expected_fee=2000),format="json")
        self.assertEqual(response.status_code,400)
        self.assertFalse(Booking.objects.exists())
        response=self.client.post("/api/v1/bookings/",payload(preferred_provider_id=provider.pk,expected_fee=3000),format="json")
        self.assertEqual(response.status_code,201,response.data)
        booking=Booking.objects.get(pk=response.data["id"])
        application=provider.provider_application
        application.pricing_tier="senior"
        application.save()
        accepted=accept_offer(provider,booking.offers.get().pk)
        self.assertEqual(accepted.quoted_fee,3000)
        self.assertEqual(str(self.client.get("/api/v1/bookings/").data["bookings"][0]["quoted_fee"]),"3000.00")

    def test_patient_cannot_choose_provider_rates_and_multiple_services_do_not_multiply_price(self):
        provider=make_provider("multi-price")
        application=provider.provider_application
        application.services=["general","spine","sports"]
        application.save()
        response=self.client.post("/api/v1/bookings/",payload(services=["general","spine","sports"],quoted_fee=1,pricing_tier="early",max_fee=3000),format="json")
        self.assertEqual(response.status_code,201,response.data)
        booking=Booking.objects.get(pk=response.data["id"])
        accepted=accept_offer(provider,booking.offers.get().pk)
        self.assertEqual(accepted.quoted_fee,3000)
        application.refresh_from_db()
        self.assertEqual(application.pricing_tier,"experienced")


from unittest.mock import patch
import uuid
from django.test import override_settings
from .models import Payment
from .payments import reconcile

@override_settings(MPESA_ENABLED=True, MPESA_ENVIRONMENT="sandbox", MPESA_SHORTCODE="174379", MPESA_CONSUMER_KEY="fixture-key", MPESA_CONSUMER_SECRET="fixture-secret", MPESA_PASSKEY="fixture-passkey", MPESA_CALLBACK_ORIGIN="https://example.test")
class PaymentTests(TestCase):
    def setUp(self):
        cache.clear()
        self.patient=User.objects.create_user(username="payer")
        self.provider=make_provider("paid-provider")
        self.client=APIClient()
        self.client.force_authenticate(self.patient)
        response=self.client.post("/api/v1/bookings/",payload(),format="json")
        self.booking=Booking.objects.get(pk=response.data["id"])
        accept_offer(self.provider,self.booking.offers.get().pk)
        self.url=f"/api/v1/bookings/{self.booking.pk}/pay/"
        self.data={"client_id":str(uuid.uuid4()),"phone":"0712345678","expected_amount":3000}

    def initiate(self):
        with patch("apps.marketplace.payments.daraja",return_value={"ResponseCode":"0","CheckoutRequestID":"checkout-fixture","MerchantRequestID":"merchant-fixture"}) as send:
            response=self.client.post(self.url,self.data,format="json")
            self.assertEqual(response.status_code,201,response.data)
            self.assertEqual(send.call_args.args[1]["Amount"],3000)
            self.assertEqual(send.call_args.args[1]["PartyB"],"174379")
        return Payment.objects.get()

    def test_patient_ownership_price_validation_and_retry_deduplication(self):
        other=User.objects.create_user(username="wrong-payer")
        self.client.force_authenticate(other)
        with patch("apps.marketplace.payments.daraja") as send:
            self.assertEqual(self.client.post(self.url,self.data,format="json").status_code,404)
            send.assert_not_called()
        self.client.force_authenticate(self.patient)
        self.assertEqual(self.client.post(self.url,{**self.data,"expected_amount":2000},format="json").status_code,400)
        payment=self.initiate()
        with patch("apps.marketplace.payments.daraja") as send:
            self.assertEqual(self.client.post(self.url,self.data,format="json").status_code,200)
            self.assertEqual(self.client.post(self.url,{**self.data,"client_id":str(uuid.uuid4())},format="json").status_code,400)
            send.assert_not_called()
        self.assertEqual(Payment.objects.count(),1)
        self.client.force_authenticate(other)
        self.assertEqual(self.client.get(f"/api/v1/payments/mpesa/{payment.pk}/").status_code,404)

    def test_untrusted_callback_cannot_mark_paid_and_verified_success_is_idempotent(self):
        payment=self.initiate()
        callback=f"/api/v1/payments/mpesa/callback/{payment.pk}/{payment.callback_token}/"
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post(callback,{"Body":{"stkCallback":{"CheckoutRequestID":payment.checkout_id,"MerchantRequestID":payment.merchant_id,"ResultCode":0}}},format="json").status_code,200)
        payment.refresh_from_db()
        self.assertEqual(payment.status,"pending")
        with patch("apps.marketplace.payments.daraja",return_value={"ResponseCode":"0","ResultCode":"0","CheckoutRequestID":payment.checkout_id,"MerchantRequestID":payment.merchant_id}):
            reconcile(payment.pk)
            reconcile(payment.pk)
        payment.refresh_from_db()
        self.booking.refresh_from_db()
        self.assertEqual(payment.status,"succeeded")
        self.assertEqual(self.booking.status,"confirmed")
        self.assertEqual(self.booking.events.filter(action="payment_verified").count(),1)
        self.assertEqual(self.booking.notifications.filter(kind="payment_verified").count(),1)
        self.client.force_authenticate(self.patient)
        self.assertEqual(self.client.post(f"/api/v1/bookings/{self.booking.pk}/cancel/",{},format="json").status_code,200)
        payment.refresh_from_db()
        self.assertEqual(payment.status,"refund_required")

    def test_ambiguous_network_failure_never_blindly_retries_a_charge(self):
        with patch("apps.marketplace.payments.daraja",side_effect=TimeoutError):
            response=self.client.post(self.url,self.data,format="json")
        self.assertEqual(response.status_code,201)
        self.assertEqual(response.data["status"],"unknown")
        with patch("apps.marketplace.payments.daraja") as send:
            self.assertEqual(self.client.post(self.url,{**self.data,"client_id":str(uuid.uuid4())},format="json").status_code,400)
            send.assert_not_called()
        self.assertEqual(self.client.post(f"/api/v1/bookings/{self.booking.pk}/cancel/",{},format="json").status_code,400)

    def test_failed_payment_allows_new_attempt_and_unpaid_progress_is_blocked(self):
        payment=self.initiate()
        self.client.force_authenticate(self.provider)
        self.assertEqual(self.client.post(f"/api/v1/bookings/{self.booking.pk}/progress/en_route/",{},format="json").status_code,400)
        with patch("apps.marketplace.payments.daraja",return_value={"ResponseCode":"0","ResultCode":"1032","CheckoutRequestID":payment.checkout_id,"MerchantRequestID":payment.merchant_id}):
            reconcile(payment.pk)
        payment.refresh_from_db()
        self.assertEqual(payment.status,"failed")
        self.client.force_authenticate(self.patient)
        with patch("apps.marketplace.payments.daraja",return_value={"ResponseCode":"0","CheckoutRequestID":"checkout-retry","MerchantRequestID":"merchant-retry"}):
            self.assertEqual(self.client.post(self.url,{**self.data,"client_id":str(uuid.uuid4())},format="json").status_code,201)

    @override_settings(MPESA_ENABLED=False)
    def test_disabled_configuration_never_calls_daraja(self):
        with patch("apps.marketplace.payments.daraja") as send:
            self.assertEqual(self.client.post(self.url,self.data,format="json").status_code,400)
            send.assert_not_called()
        self.assertFalse(Payment.objects.exists())
