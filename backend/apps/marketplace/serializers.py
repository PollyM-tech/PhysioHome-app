from django.contrib.gis.geos import Point
from rest_framework import serializers

from .catalog import SPECIALTIES


class ServiceSelectionField(serializers.ListField):
    def __init__(self, **kwargs):
        super().__init__(child=serializers.ChoiceField(choices=list(SPECIALTIES)), min_length=1, max_length=3, **kwargs)

    def to_internal_value(self, data):
        values = super().to_internal_value(data)
        if len(values) != len(set(values)):
            raise serializers.ValidationError("Choose each service only once.")
        return values


class LocationInput(serializers.Serializer):
    label = serializers.CharField(max_length=200)
    latitude = serializers.FloatField(min_value=-90, max_value=90)
    longitude = serializers.FloatField(min_value=-180, max_value=180)

    def validate(self, attrs):
        import math
        if not all(math.isfinite(attrs[key]) for key in ("latitude", "longitude")):
            raise serializers.ValidationError("Select a finite map coordinate.")
        return attrs

    @staticmethod
    def point(data):
        return Point(data["longitude"], data["latitude"], srid=4326)


class CoverageRegistrationInput(LocationInput):
    radius_km = serializers.ChoiceField(choices=[5, 10, 15])


class CoverageInput(CoverageRegistrationInput):
    availability = serializers.ChoiceField(choices=["available_now", "scheduled_only", "offline"])


class SearchInput(LocationInput):
    max_fee = serializers.IntegerField(min_value=2000, max_value=4500, default=4500)
    services = ServiceSelectionField(required=False)
    specialty = serializers.ChoiceField(choices=list(SPECIALTIES), required=False)
    starts_at = serializers.DateTimeField(required=False)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        # Preserve old single-service clients while new clients send the canonical array.
        if "services" not in attrs:
            if "specialty" not in attrs:
                raise serializers.ValidationError({"services": "Choose between one and three services."})
            attrs["services"] = [attrs["specialty"]]
        if "specialty" in attrs and attrs["specialty"] != attrs["services"][0]:
            raise serializers.ValidationError({"services": "The primary service must match the first selected service."})
        attrs["specialty"] = attrs["services"][0]
        return attrs

    def validate_starts_at(self, value):
        from datetime import timedelta
        from django.utils import timezone
        if value < timezone.now() + timedelta(minutes=5):
            raise serializers.ValidationError("Choose a time at least five minutes from now.")
        if value > timezone.now() + timedelta(days=90):
            raise serializers.ValidationError("Choose a time within the next 90 days.")
        return value


class BookingInput(SearchInput):
    expected_fee = serializers.IntegerField(min_value=2000, max_value=4500, required=False)
    directions = serializers.CharField(max_length=500, required=False, allow_blank=True)
    preferred_provider_id = serializers.IntegerField(min_value=1, required=False)
