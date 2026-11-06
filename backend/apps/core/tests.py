from unittest.mock import patch

from django.db import OperationalError, connection
from django.test import SimpleTestCase, TestCase
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D
from rest_framework.permissions import IsAuthenticated
from rest_framework.settings import api_settings


class HealthTests(SimpleTestCase):
    def test_liveness_does_not_need_database_or_authentication(self):
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_readiness_returns_generic_failure_without_database_details(self):
        with patch("apps.core.views.connection") as unavailable_connection:
            unavailable_connection.cursor.side_effect = OperationalError("private connection detail")
            with self.assertLogs("apps.core.views", level="ERROR"):
                response = self.client.get("/api/v1/ready/")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable"})

    def test_api_permissions_default_to_authenticated(self):
        self.assertEqual(api_settings.DEFAULT_PERMISSION_CLASSES, [IsAuthenticated])


class PostGISTests(TestCase):
    def test_readiness_with_postgis(self):
        response = self.client.get("/api/v1/ready/")
        self.assertEqual(response.status_code, 200)

    def test_spatial_distance_uses_meters_and_geodjango_is_available(self):
        patient = Point(36.8219, -1.2921, srid=4326)
        nearby = Point(36.8220, -1.2921, srid=4326)
        distant = Point(36.90, -1.2921, srid=4326)
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT ST_DWithin(ST_GeogFromText(%s), ST_GeogFromText(%s), %s), "
                "ST_DWithin(ST_GeogFromText(%s), ST_GeogFromText(%s), %s)",
                [patient.ewkt, nearby.ewkt, D(km=1).m, patient.ewkt, distant.ewkt, D(km=1).m],
            )
            self.assertEqual(cursor.fetchone(), (True, False))
