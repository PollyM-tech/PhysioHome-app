"""M-Pesa STK intent, verification and reconciliation. No client/callback can mark a booking paid."""
import base64
import json
import secrets
import re
from datetime import timedelta
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes, authentication_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.accounts.permissions import IsPatient
from apps.accounts.serializers import normalize_phone
from .models import Booking, Payment, BookingEvent
from .notifications import create_notification
from .throttles import PatientWriteThrottle

OPEN_PAYMENTS = ["initiating", "pending", "unknown"]


def configured():
    return bool(settings.MPESA_ENVIRONMENT in ["sandbox", "production"] and settings.MPESA_ENABLED and settings.MPESA_CONSUMER_KEY and settings.MPESA_CONSUMER_SECRET and settings.MPESA_PASSKEY and settings.MPESA_SHORTCODE and urlsplit(settings.MPESA_CALLBACK_ORIGIN).scheme == "https" and urlsplit(settings.MPESA_CALLBACK_ORIGIN).netloc)


def request_json(url, headers, body=None):
    request = Request(url, data=json.dumps(body).encode() if body is not None else None, headers={"Accept": "application/json", "Content-Type": "application/json", **headers})
    with urlopen(request, timeout=8) as response:
        return json.load(response)


def daraja(path, body):
    origin = "https://api.safaricom.co.ke" if settings.MPESA_ENVIRONMENT == "production" else "https://sandbox.safaricom.co.ke"
    credentials = base64.b64encode((settings.MPESA_CONSUMER_KEY + ":" + settings.MPESA_CONSUMER_SECRET).encode()).decode()
    oauth = request_json(origin+"/oauth/v1/generate?grant_type=client_credentials", {"Authorization": "Basic " + credentials})
    return request_json(origin+path, {"Authorization": "Bearer " + oauth["access_token"]}, body)


def signed_fields():
    stamp = timezone.now().astimezone(ZoneInfo("Africa/Nairobi")).strftime("%Y%m%d%H%M%S")
    password = base64.b64encode((settings.MPESA_SHORTCODE+settings.MPESA_PASSKEY+stamp).encode()).decode()
    return {"BusinessShortCode": settings.MPESA_SHORTCODE, "Password": password, "Timestamp": stamp}


def payment_data(payment):
    return {"id": str(payment.pk), "booking_id": str(payment.booking_id), "amount": payment.amount, "currency": "KES", "status": payment.status, "created_at": payment.created_at}


class InitiateInput(serializers.Serializer):
    client_id = serializers.UUIDField()
    phone = serializers.CharField(max_length=30)
    expected_amount = serializers.IntegerField(min_value=2000, max_value=4500)

    def validate_phone(self, value):
        phone = normalize_phone(value)
        if not re.fullmatch(r"\+254[17]\d{8}", phone):
            raise serializers.ValidationError("Enter a valid Kenyan mobile number for M-Pesa.")
        return phone


@api_view(["GET"])
@permission_classes([IsPatient])
def list_payments(request):
    response = Response({"enabled": configured(), "merchant": "PhysioHome", "payments": [payment_data(p) for p in Payment.objects.filter(booking__patient=request.user).order_by("-created_at")[:50]]})
    response["Cache-Control"] = "no-store"
    return response


@api_view(["POST"])
@permission_classes([IsPatient])
@throttle_classes([PatientWriteThrottle])
def initiate(request, booking_id):
    serializer = InitiateInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    if not configured():
        raise ValidationError("M-Pesa checkout is not configured yet. No payment request has been sent.")
    with transaction.atomic():
        booking = get_object_or_404(Booking.objects.select_for_update(), pk=booking_id, patient=request.user)
        previous = Payment.objects.filter(client_id=data["client_id"]).first()
        if previous:
            if previous.booking_id != booking.pk:
                raise ValidationError("This payment request identifier has already been used.")
            return Response(payment_data(previous))
        if booking.status != "payment_pending" or booking.quoted_fee is None:
            raise ValidationError("Only an accepted, priced appointment can be paid.")
        amount = int(booking.quoted_fee)
        if amount != booking.quoted_fee or amount != data["expected_amount"]:
            raise ValidationError("The total differs from the confirmed booking price. Refresh Bookings before paying.")
        if Payment.objects.filter(booking=booking).exclude(status="failed").exists():
            raise ValidationError("This booking already has a pending or successful payment. Check its status before retrying.")
        payment = Payment.objects.create(booking=booking, client_id=data["client_id"], phone=data["phone"], amount=amount, callback_token=secrets.token_urlsafe(32))
    body = {**signed_fields(), "TransactionType": "CustomerPayBillOnline", "Amount": payment.amount,
            "PartyA": payment.phone.lstrip("+"), "PartyB": settings.MPESA_SHORTCODE, "PhoneNumber": payment.phone.lstrip("+"),
            "CallBackURL": settings.MPESA_CALLBACK_ORIGIN.rstrip("/")+f"/api/v1/payments/mpesa/callback/{payment.pk}/{payment.callback_token}/",
            "AccountReference": "PhysioHome", "TransactionDesc": "Physio session"}
    try:
        result = daraja("/mpesa/stkpush/v1/processrequest", body)
        with transaction.atomic():
            payment = Payment.objects.select_for_update().get(pk=payment.pk)
            if str(result.get("ResponseCode")) == "0" and result.get("CheckoutRequestID") and result.get("MerchantRequestID"):
                payment.checkout_id, payment.merchant_id, payment.status = result["CheckoutRequestID"], result["MerchantRequestID"], "pending"
            else:
                # Unexpected/ambiguous responses must be reconciled manually, never blindly retried.
                payment.status = "unknown"
            payment.save()
    except Exception:
        Payment.objects.filter(pk=payment.pk, status="initiating").update(status="unknown")
        payment.refresh_from_db()
    return Response(payment_data(payment), status=201)


def reconcile(payment_id):
    if not configured():
        return
    # Lock ordering matches cancellation/other booking actions.
    lookup = Payment.objects.filter(pk=payment_id).values("booking_id").first()
    if not lookup:
        return
    with transaction.atomic():
        booking = Booking.objects.select_for_update().get(pk=lookup["booking_id"])
        payment = Payment.objects.select_for_update().get(pk=payment_id)
        if payment.status not in OPEN_PAYMENTS or not payment.checkout_id:
            return
        if payment.checked_at and payment.checked_at > timezone.now()-timedelta(seconds=30):
            return
        payment.checked_at = timezone.now()
        payment.save(update_fields=["checked_at"])
        try:
            result = daraja("/mpesa/stkpushquery/v1/query", {**signed_fields(), "CheckoutRequestID": payment.checkout_id})
        except Exception:
            return
        if result.get("CheckoutRequestID") != payment.checkout_id or result.get("MerchantRequestID") != payment.merchant_id or str(result.get("ResponseCode")) != "0":
            return
        code = str(result.get("ResultCode", ""))
        if code == "0":
            if booking.status == "payment_pending":
                booking.status = "confirmed"
                booking.save(update_fields=["status"])
                payment.status = "succeeded"
                BookingEvent.objects.create(booking=booking, action="payment_verified")
                create_notification(booking, "payment_verified", "Payment confirmed", "Your session payment has been verified. Open Bookings for your appointment.")
            else:
                # Preserve funds/accounting if state was changed administratively while STK was pending.
                payment.status = "refund_required"
        elif code in ["1", "1032", "1037", "2001"]:
            payment.status = "failed"
        else:
            return
        payment.result_code = code
        payment.save(update_fields=["status", "result_code"])


@api_view(["GET"])
@permission_classes([IsPatient])
def payment_status(request, payment_id):
    payment = get_object_or_404(Payment, pk=payment_id, booking__patient=request.user)
    reconcile(payment.pk)
    payment.refresh_from_db()
    response = Response(payment_data(payment))
    response["Cache-Control"] = "no-store"
    return response


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def callback(request, payment_id, token):
    payment = Payment.objects.filter(pk=payment_id).first()
    if payment and secrets.compare_digest(payment.callback_token, token):
        # Only accelerate verification; even a matching callback never proves payment.
        body = request.data.get("Body", {}) if isinstance(request.data, dict) else {}
        event = body.get("stkCallback", {}) if isinstance(body, dict) else {}
        if isinstance(event, dict) and event.get("CheckoutRequestID") == payment.checkout_id and event.get("MerchantRequestID") == payment.merchant_id:
            Payment.objects.filter(pk=payment.pk, status="pending").update(checked_at=None)
    return Response({"ResultCode": 0, "ResultDesc": "Accepted"})
