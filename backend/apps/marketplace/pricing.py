from django.db.models import Case, When, Value, F, IntegerField

TIERS = [("early", "1 to under 3 years"), ("experienced", "3 to under 5 years"), ("senior", "5+ years"), ("consultant", "Approved consultant")]
RATES = {"early": 2000, "experienced": 3000, "senior": 3500}


def session_fee(application):
    if not application.pricing_reviewed_at:
        return None
    if application.pricing_tier in RATES:
        return RATES[application.pricing_tier]
    if application.pricing_tier == "consultant" and application.consultant_fee and 3500 <= application.consultant_fee <= 4500:
        return application.consultant_fee
    return None


def fee_expression():
    prefix = "user__provider_application__"
    return Case(*[When(**{prefix+"pricing_tier": tier, "then": Value(rate)}) for tier, rate in RATES.items()], When(**{prefix+"pricing_tier": "consultant", "then": F(prefix+"consultant_fee")}), default=None, output_field=IntegerField())
