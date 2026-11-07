from .throttles import MessageWriteThrottle
import base64
import binascii
import re
import uuid

from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.accounts.models import ProviderApplication
from apps.accounts.permissions import IsActiveAccount
from .models import Booking, Message, RESERVED_STATUSES
from .notifications import create_notification


def private(response):
    response["Cache-Control"] = "no-store"
    return response


def own_bookings(user):
    if user.role == "patient":
        return Booking.objects.filter(patient=user, provider__isnull=False)
    if user.role == "physiotherapist" and ProviderApplication.objects.filter(user=user, verification_status="approved").exists():
        return Booking.objects.filter(provider=user)
    raise PermissionDenied("An approved appointment participant is required.")


def message_data(item, user):
    return {"id": str(item.pk), "text": item.text, "mine": item.sender_id == user.pk,
            "sender_name": item.sender.full_name, "created_at": item.created_at, "read_at": item.read_at,
            "attachment": {"name": item.filename, "mime": item.mime} if item.attachment else None}


@api_view(["GET"])
@permission_classes([IsActiveAccount])
@throttle_classes([MessageWriteThrottle])
def conversations(request):
    rows = []
    for booking in own_bookings(request.user).select_related("provider", "patient").order_by("-created_at")[:50]:
        last = booking.messages.order_by("-created_at", "-pk").first()
        other = booking.provider if request.user.pk == booking.patient_id else booking.patient
        rows.append({"id": str(booking.pk), "name": other.full_name, "status": booking.status,
                     "starts_at": booking.starts_at, "last_message": last.text if last else "", "last_at": last.created_at if last else booking.created_at,
                     "unread": booking.messages.exclude(sender=request.user).filter(read_at__isnull=True).count()})
    rows.sort(key=lambda x: x["last_at"], reverse=True)
    return private(Response({"conversations": rows}))


class MessageInput(serializers.Serializer):
    client_id = serializers.UUIDField()
    text = serializers.CharField(max_length=2000, required=False, allow_blank=True)
    filename = serializers.CharField(max_length=100, required=False)
    content = serializers.CharField(max_length=7 * 1024 * 1024, required=False, trim_whitespace=False)

    def validate(self, data):
        if not data.get("text") and not data.get("content"):
            raise serializers.ValidationError("Write a message or attach a file.")
        if data.get("content"):
            try:
                content = base64.b64decode(data["content"], validate=True)
            except (ValueError, binascii.Error):
                raise serializers.ValidationError("The attachment could not be read.")
            if not content or len(content) > 5 * 1024 * 1024:
                raise serializers.ValidationError("Attachments must be at most 5 MB.")
            formats = [(b"%PDF-", "application/pdf", ".pdf"), (b"\x89PNG\r\n\x1a\n", "image/png", ".png"), (b"\xff\xd8\xff", "image/jpeg", ".jpg")]
            match = next((x for x in formats if content.startswith(x[0])), None)
            if not match:
                raise serializers.ValidationError("Attach a PDF, PNG or JPEG file.")
            name = re.sub(r"[^A-Za-z0-9 ._-]", "_", data.get("filename", "attachment"))[:80].strip(". ") or "attachment"
            data.update(file_bytes=content, mime=match[1], extension=match[2], filename=name.rsplit(".", 1)[0] + match[2])
        return data


def read_messages(booking, user, query=None, before=None):
    items = booking.messages.select_related("sender").order_by("-created_at", "-pk")
    if query:
        items = items.filter(Q(text__icontains=query) | Q(filename__icontains=query))
    if before:
        cursor = get_object_or_404(Message, pk=before, booking=booking)
        items = items.filter(Q(created_at__lt=cursor.created_at) | Q(created_at=cursor.created_at, pk__lt=cursor.pk))
    rows = list(items[:51])
    more = len(rows) > 50
    rows = rows[:50]
    unread = [x.pk for x in rows if x.sender_id != user.pk and not x.read_at]
    if unread and not query:
        now = timezone.now()
        Message.objects.filter(pk__in=unread, read_at__isnull=True).update(read_at=now)
        for item in rows:
            if item.pk in unread:
                item.read_at = now
    return {"messages": [message_data(x, user) for x in reversed(rows)], "next_before": str(rows[-1].pk) if more else None,
            "can_send": booking.status in [*RESERVED_STATUSES, "completed"]}


@api_view(["GET", "POST"])
@permission_classes([IsActiveAccount])
@throttle_classes([MessageWriteThrottle])
def messages(request, booking_id):
    booking = get_object_or_404(own_bookings(request.user), pk=booking_id)
    if request.method == "GET":
        before = request.query_params.get("before")
        if before:
            try:
                uuid.UUID(before)
            except ValueError:
                raise ValidationError("Invalid message cursor.")
        return private(Response(read_messages(booking, request.user, before=before)))
    serializer = MessageInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    # Serializing with cancellation prevents sending after an appointment is closed.
    with transaction.atomic():
        booking = Booking.objects.select_for_update().get(pk=booking.pk)
        if booking.status not in [*RESERVED_STATUSES, "completed"]:
            raise ValidationError("This conversation is read-only because the appointment is closed.")
        existing = Message.objects.filter(sender=request.user, client_id=data["client_id"]).first()
        if existing:
            if existing.booking_id != booking.pk:
                raise ValidationError("This message identifier has already been used.")
            return private(Response(message_data(existing, request.user)))
        item = Message(booking=booking, sender=request.user, client_id=data["client_id"], text=data.get("text", ""))
        if data.get("file_bytes"):
            item.filename, item.mime = data["filename"], data["mime"]
            item.attachment.save(uuid.uuid4().hex + data["extension"], ContentFile(data["file_bytes"]), save=False)
        try:
            item.save()
        except Exception:
            if item.attachment:
                item.attachment.delete(save=False)
            raise
        if request.user.pk == booking.provider_id:
            create_notification(booking, "msg:" + item.pk.hex, "New appointment message", "Your physiotherapist sent you a message. Open Messages to read it.")
    return private(Response(message_data(item, request.user), status=201))


class SearchInput(serializers.Serializer):
    query = serializers.CharField(min_length=2, max_length=120)


@api_view(["POST"])
@permission_classes([IsActiveAccount])
@throttle_classes([MessageWriteThrottle])
def search_messages(request, booking_id):
    booking = get_object_or_404(own_bookings(request.user), pk=booking_id)
    serializer = SearchInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    return private(Response(read_messages(booking, request.user, query=serializer.validated_data["query"])))


@api_view(["GET"])
@permission_classes([IsActiveAccount])
@throttle_classes([MessageWriteThrottle])
def attachment(request, booking_id, message_id):
    booking = get_object_or_404(own_bookings(request.user), pk=booking_id)
    item = get_object_or_404(Message, booking=booking, pk=message_id)
    if not item.attachment:
        raise ValidationError("This message has no attachment.")
    with item.attachment.open("rb") as file:
        content = base64.b64encode(file.read()).decode("ascii")
    return private(Response({"content": content, "filename": item.filename, "mime": item.mime}))
