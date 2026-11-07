import hashlib
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache
from rest_framework import serializers
from rest_framework.decorators import api_view, authentication_classes, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

# Approximate neighbourhood centers, never presented as street/address lookup.
AREAS = [
    ("Nairobi city centre", -1.2921, 36.8219),
    ("Westlands, Nairobi", -1.2676, 36.8108),
    ("Kilimani, Nairobi", -1.2924, 36.7878),
    ("Karen, Nairobi", -1.3190, 36.7080),
    ("Rongai", -1.3960, 36.7430),
    ("Mombasa", -4.0435, 39.6682),
    ("Kisumu", -0.0917, 34.7680),
    ("Nakuru", -0.3031, 36.0800),
]


class PlaceThrottle(AnonRateThrottle):
    rate = "20/min"


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([PlaceThrottle])
def search_places(request):
    query = request.query_params.get("q", "").strip()
    if not 2 <= len(query) <= 120:
        raise serializers.ValidationError("Enter between 2 and 120 characters to search.")
    key = getattr(settings, "GOOGLE_MAPS_API_KEY", "")
    if not key or request.query_params.get("map_provider") != "google":
        return Response({"limited": True, "source": "kenya_area_directory", "results": [
            {"label": label, "latitude": lat, "longitude": lon}
            for label, lat, lon in AREAS if query.casefold() in label.casefold()
        ]})
    cache_key = "places:" + hashlib.sha256(query.casefold().encode()).hexdigest()
    data = cache.get(cache_key)
    if data is None:
        request_data = json.dumps({"textQuery": query, "regionCode": "KE", "pageSize": 5}).encode()
        outbound = Request("https://places.googleapis.com/v1/places:searchText", data=request_data, headers={
            "Content-Type": "application/json", "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location",
        })
        try:
            with urlopen(outbound, timeout=6) as response:
                places = json.load(response).get("places", [])
            data = [{"label": (place.get("formattedAddress") or place.get("displayName", {}).get("text", "Selected place"))[:200],
                     "latitude": place["location"]["latitude"], "longitude": place["location"]["longitude"]}
                    for place in places if place.get("location")]
        except (HTTPError, URLError, TimeoutError, ValueError, KeyError):
            return Response({"detail": "Place search is unavailable. Retry or select a map pin."}, status=503)
        # Google Places storage/retention requirements must be reviewed for production use.
        cache.set(cache_key, data, 300)
    return Response({"limited": False, "source": "google_places", "results": data})
