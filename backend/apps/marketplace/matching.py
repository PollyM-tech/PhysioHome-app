from datetime import timedelta

from django.contrib.gis.db.models.functions import Distance
from django.db import transaction
from django.db.models import ExpressionWrapper, F, FloatField, Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.accounts.models import User
from .catalog import SPECIALTIES
from .models import Booking, Coverage, Offer, RESERVED_STATUSES
from .notifications import notify_patient
from .pricing import fee_expression


def eligible(location, services, starts_at, ends_at, scheduled, exclude_booking=None, max_fee=4500):
    # Geography distances are metres; each provider has their own coverage radius.
    query = Coverage.objects.filter(
        center__isnull=False, center__dwithin=(location, 15000), user__is_active=True, user__account_status="active",
        user__role="physiotherapist", user__provider_application__verification_status="approved",
        user__provider_application__services__contains=services,
        availability__in=["available_now", "scheduled_only"] if scheduled else ["available_now"],
    ).annotate(distance_m=Distance("center", location)).filter(
        distance_m__lte=ExpressionWrapper(F("radius_km") * 1000.0, output_field=FloatField())
    )
    query = query.filter(user__provider_application__pricing_reviewed_at__isnull=False).annotate(session_fee=fee_expression()).filter(session_fee__gte=2000, session_fee__lte=max_fee)
    conflicts = Booking.objects.filter(
        provider__isnull=False, status__in=RESERVED_STATUSES,
        starts_at__lt=ends_at, ends_at__gt=starts_at,
    ).exclude(pk=exclude_booking).values_list("provider_id", flat=True)
    return query.exclude(user_id__in=conflicts).select_related("user", "user__provider_application").order_by("distance_m", "user_id")


def advance_search(booking):
    """Called under the booking row lock; expiry is driven by active polling, not fake push events."""
    if booking.status != Booking.Status.SEARCHING:
        return
    now = timezone.now()
    booking.offers.filter(status="open", expires_at__lte=now).update(status="expired")
    if booking.search_expires_at <= now:
        booking.status = Booking.Status.EXPIRED
        booking.save(update_fields=["status"])
        booking.offers.filter(status="open").update(status="closed")
        notify_patient(booking, "expired")
        return
    if booking.offers.filter(status="open").exists():
        return
    candidates = eligible(booking.location, booking.services, booking.starts_at, booking.ends_at, booking.scheduled, max_fee=booking.max_fee)
    if booking.mode == "choose" and not booking.preferred_provider_id:
        booking.status = Booking.Status.NO_MATCH
        booking.save(update_fields=["status"])
        notify_patient(booking, "no_match")
        return
    if booking.preferred_provider_id:
        candidates = candidates.filter(user_id=booking.preferred_provider_id)
    candidates = candidates.exclude(user_id__in=booking.offers.values_list("provider_id", flat=True))[:3]
    offers = [Offer(booking=booking, provider_id=candidate.user_id, quoted_fee=booking.quoted_fee if booking.preferred_provider_id and booking.quoted_fee is not None else candidate.session_fee, expires_at=min(now + timedelta(seconds=60), booking.search_expires_at)) for candidate in candidates]
    if offers:
        Offer.objects.bulk_create(offers)
    else:
        booking.status = Booking.Status.NO_MATCH
        booking.save(update_fields=["status"])
        notify_patient(booking, "no_match")


@transaction.atomic
def accept_offer(user, offer_id):
    # Lock the provider first across ALL acceptances, then this booking. This protects
    # both first-acceptance wins and overlapping appointments for the same provider.
    User.objects.select_for_update(no_key=True).get(pk=user.pk)
    offer = Offer.objects.filter(pk=offer_id, provider=user).first()
    if not offer:
        from rest_framework.exceptions import NotFound
        raise NotFound("This offer is unavailable.")
    booking = Booking.objects.select_for_update().get(pk=offer.booking_id)
    advance_search(booking)
    offer.refresh_from_db()
    if booking.status != Booking.Status.SEARCHING or offer.status != Offer.Status.OPEN or offer.expires_at <= timezone.now():
        raise ValidationError("This request is no longer available.")
    if not eligible(booking.location, booking.services, booking.starts_at, booking.ends_at, booking.scheduled).filter(user=user).exists():
        raise ValidationError("You are no longer eligible for this appointment. Check availability and conflicts.")
    if offer.quoted_fee is None or offer.quoted_fee > booking.max_fee:
        raise ValidationError("This offer has no valid agreed price. Ask the patient to submit a new request.")
    booking.quoted_fee = offer.quoted_fee
    booking.provider = user
    booking.status = Booking.Status.PAYMENT_PENDING
    booking.save(update_fields=["provider", "status", "quoted_fee"])
    booking.offers.exclude(pk=offer.pk).filter(status="open").update(status="closed")
    offer.status = Offer.Status.ACCEPTED
    offer.save(update_fields=["status"])
    notify_patient(booking, "accepted")
    return booking
