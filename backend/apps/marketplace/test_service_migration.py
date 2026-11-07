from datetime import timedelta

from django.contrib.gis.geos import Point
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase
from django.utils import timezone


class ServiceMigrationTests(TransactionTestCase):
    old = [("accounts", "0002_authsession_providerapplication_and_more"), ("marketplace", "0002_booking_mode")]
    new = [("accounts", "0003_providerapplication_services_and_more"), ("marketplace", "0003_booking_services_and_more")]

    def test_existing_provider_and_booking_keep_their_service(self):
        executor = MigrationExecutor(connection)
        executor.migrate(self.old)
        apps = executor.loader.project_state(self.old).apps
        try:
            User = apps.get_model("accounts", "User")
            Provider = apps.get_model("accounts", "ProviderApplication")
            Booking = apps.get_model("marketplace", "Booking")
            provider = User.objects.create(username="legacy-provider", role="physiotherapist")
            patient = User.objects.create(username="legacy-patient")
            application = Provider.objects.create(user_id=provider.pk, license_number="TEST", specialty="Spine & Back Therapy", experience="1 year", service_area="Nairobi")
            now = timezone.now()
            booking = Booking.objects.create(patient_id=patient.pk, specialty="sports", location=Point(36.8219,-1.2921,srid=4326), area_label="Test", starts_at=now, ends_at=now+timedelta(hours=1), search_expires_at=now+timedelta(minutes=5))
            executor = MigrationExecutor(connection)
            executor.migrate(self.new)
            new_apps = executor.loader.project_state(self.new).apps
            self.assertEqual(new_apps.get_model("accounts", "ProviderApplication").objects.get(pk=application.pk).services, ["spine"])
            self.assertEqual(new_apps.get_model("marketplace", "Booking").objects.get(pk=booking.pk).services, ["sports"])
        finally:
            restore = MigrationExecutor(connection)
            restore.migrate(restore.loader.graph.leaf_nodes())
