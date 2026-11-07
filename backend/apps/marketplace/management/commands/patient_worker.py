import time
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import close_old_connections, transaction
from apps.marketplace.payments import reconcile, OPEN_PAYMENTS
from apps.marketplace.models import Booking, Payment
from apps.marketplace.matching import advance_search

class Command(BaseCommand):
    help = "Advance patient dispatch/expiry and deliver configured pushes every 30 seconds."

    def add_arguments(self, parser):
        parser.add_argument("--once", action="store_true")

    def handle(self, *args, **options):
        while True:
            close_old_connections()
            for pk in Booking.objects.filter(status="searching").order_by("created_at").values_list("pk", flat=True)[:100]:
                with transaction.atomic():
                    item = Booking.objects.select_for_update(skip_locked=True).filter(pk=pk, status="searching").first()
                    if item:
                        advance_search(item)
            for payment_id in Payment.objects.filter(status__in=OPEN_PAYMENTS, checkout_id__isnull=False).order_by("created_at").values_list("pk", flat=True)[:50]:
                reconcile(payment_id)
            call_command("deliver_push", stdout=self.stdout)
            if options["once"]:
                return
            time.sleep(30)
