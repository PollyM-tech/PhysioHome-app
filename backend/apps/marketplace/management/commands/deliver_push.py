"""Run every minute in production. Delivers generic, opt-in pushes; never clinical text."""
import json
from datetime import timedelta
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.marketplace.models import PushDelivery, PushDevice


def expo_request(path, payload):
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if settings.EXPO_PUSH_ACCESS_TOKEN:
        headers["Authorization"] = "Bearer " + settings.EXPO_PUSH_ACCESS_TOKEN
    request = Request("https://exp.host/--/api/v2/push/" + path, data=json.dumps(payload).encode(), headers=headers, method="POST")
    with urlopen(request, timeout=8) as response:
        return json.load(response)["data"]


class Command(BaseCommand):
    help = "Deliver queued Expo pushes and check delivery receipts. Configure a one-minute scheduler."

    def handle(self, *args, **options):
        if not settings.EXPO_PUSH_ENABLED:
            self.stdout.write("Push delivery is disabled; no network requests made.")
            return
        for _ in range(20):
            with transaction.atomic():
                item = PushDelivery.objects.select_for_update(skip_locked=True).filter(status="queued", attempts__lt=3, updated_at__lte=timezone.now()-timedelta(seconds=30)).order_by("pk").first()
                if not item:
                    break
                device = item.device
                eligible = device.active and device.user_id == item.notification.user_id and device.user.is_active and device.user.account_status == "active" and device.session_id and not device.session.revoked_at and device.session.expires_at > timezone.now() and getattr(device.user, "patient_profile", None) and device.user.patient_profile.push_enabled
                if not eligible:
                    item.status = "skipped"
                else:
                    item.attempts += 1
                    try:
                        result = expo_request("send", {"to": device.token, "title": "PhysioHome update", "body": "You have a new appointment update. Open PhysioHome to view it.", "data": {"screen": "notifications"}, "sound": "default", "channelId": "appointments"})
                        if result.get("status") == "ok":
                            item.ticket, item.status = result["id"], "sent"
                        else:
                            item.error = result.get("details", {}).get("error", "PushRejected")[:100]
                            if item.error == "DeviceNotRegistered":
                                transaction.on_commit(lambda pk=device.pk: PushDevice.objects.filter(pk=pk).update(active=False))
                            item.status = "failed"
                    except Exception:
                        item.error = "PushServiceUnavailable"
                        if item.attempts >= 3:
                            item.status = "failed"
                item.save()
        for pk in PushDelivery.objects.filter(status="sent", updated_at__lte=timezone.now()-timedelta(minutes=15)).values_list("pk", flat=True)[:100]:
            with transaction.atomic():
                item = PushDelivery.objects.select_for_update(skip_locked=True).filter(pk=pk, status="sent").first()
                if not item:
                    continue
                try:
                    result = expo_request("getReceipts", {"ids": [item.ticket]}).get(item.ticket)
                    if result:
                        item.status = "delivered" if result.get("status") == "ok" else "failed"
                        item.error = result.get("details", {}).get("error", "")[:100]
                        if item.error == "DeviceNotRegistered":
                            transaction.on_commit(lambda pk=item.device_id: PushDevice.objects.filter(pk=pk).update(active=False))
                    elif item.notification.created_at < timezone.now()-timedelta(hours=24):
                        item.status, item.error = "failed", "ReceiptExpired"
                    item.save()
                except Exception:
                    continue
        self.stdout.write("Push outbox processed.")
