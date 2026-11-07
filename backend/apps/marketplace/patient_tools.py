import re

from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.accounts.permissions import IsPatient
from .catalog import SPECIALTIES
from .models import Booking, Notification
from .matching import advance_search

# Search synonyms organize the catalogue; they do not diagnose symptoms.
ALIASES = {
    "spine": ["back", "spine", "neck", "back pain", "neck pain", "posture"],
    "sports": ["sport", "sports", "sports injury", "sports injuries", "sprain", "strain"],
    "knee": ["knee", "joint", "joints", "knee pain", "hip", "shoulder"],
    "neurological": ["stroke", "neurological", "neuro", "balance"],
    "elderly": ["elderly", "senior", "mobility", "walking"],
    "post_surgery": ["surgery", "post surgery", "post operative", "after surgery"],
    "pediatric": ["child", "children", "pediatric", "paediatric"],
    "womens_health": ["women", "woman", "pelvic", "postpartum"],
    "cardiopulmonary": ["cardiopulmonary", "pulmonary", "respiratory"],
    "general": ["physio", "physiotherapy", "general", "muscle pain"],
}


class ServiceSearchInput(serializers.Serializer):
    query = serializers.CharField(min_length=2, max_length=120)


@api_view(["POST"])
@permission_classes([IsPatient])
def search_services(request):
    data = ServiceSearchInput(data=request.data)
    data.is_valid(raise_exception=True)
    query = re.sub(r"[^\w]+", " ", data.validated_data["query"].casefold()).strip()
    ranked = []
    for code, label in SPECIALTIES.items():
        phrases = [re.sub(r"[^\w]+", " ", label.casefold()).strip(), *ALIASES[code]]
        score = max((100 if phrase == query else len(phrase.split()) * 10 if " " + phrase + " " in " " + query + " " else 0) for phrase in phrases)
        if score:
            ranked.append((score, {"code": code, "label": label}))
    ranked.sort(key=lambda row: -row[0])
    return Response({"services": [item for _, item in ranked[:5]]})


def notification_data(item):
    return {"id": item.pk, "booking_id": str(item.booking_id), "title": item.title, "body": item.body,
            "created_at": item.created_at, "read_at": item.read_at}


@api_view(["GET"])
@permission_classes([IsPatient])
def notifications(request):
    # Keep the patient's search status current even when they return to the home bell.
    for pk in Booking.objects.filter(patient=request.user, status="searching").values_list("pk", flat=True):
        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(pk=pk)
            advance_search(booking)
    own = Notification.objects.filter(user=request.user)
    response = Response({"notifications": [notification_data(item) for item in own[:50]], "unread_count": own.filter(read_at__isnull=True).count()})
    response["Cache-Control"] = "no-store"
    return response


class ReadNotificationInput(serializers.Serializer):
    id = serializers.IntegerField(min_value=1, required=False)
    all = serializers.BooleanField(default=False)

    def validate(self, attrs):
        if bool(attrs.get("id")) == attrs["all"]:
            raise serializers.ValidationError("Choose one notification or mark all as read.")
        return attrs


@api_view(["POST"])
@permission_classes([IsPatient])
def read_notifications(request):
    serializer = ReadNotificationInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    own = Notification.objects.filter(user=request.user)
    if serializer.validated_data["all"]:
        own.filter(read_at__isnull=True).update(read_at=timezone.now())
    else:
        item = get_object_or_404(own, pk=serializer.validated_data["id"])
        if item.read_at is None:
            item.read_at = timezone.now()
            item.save(update_fields=["read_at"])
    response = Response({"unread_count": own.filter(read_at__isnull=True).count()})
    response["Cache-Control"] = "no-store"
    return response
