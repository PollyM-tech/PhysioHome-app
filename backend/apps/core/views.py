import logging

from django.db import DatabaseError, connection
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

logger = logging.getLogger(__name__)


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def health(request):
    """Liveness only; readiness separately checks database and PostGIS."""
    return Response({"status": "ok"})


@api_view(["GET"])
@authentication_classes([])
@permission_classes([AllowAny])
def readiness(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT PostGIS_Version()")
            cursor.fetchone()
    except DatabaseError:
        logger.exception("Database/PostGIS readiness check failed")
        return Response({"status": "unavailable"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response({"status": "ok"})
