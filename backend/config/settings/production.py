"""Production baseline; deployment must supply secrets, hosts and HTTPS."""
from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403

if not ALLOWED_HOSTS or "*" in ALLOWED_HOSTS or set(ALLOWED_HOSTS) <= {"localhost", "127.0.0.1"}:
    raise ImproperlyConfigured("Set DJANGO_ALLOWED_HOSTS to explicit production hosts.")

if not PUBLIC_API_ORIGIN.startswith("https://"):
    raise ImproperlyConfigured("Set PUBLIC_API_ORIGIN to the HTTPS backend origin for recovery links.")
if CACHES["default"]["BACKEND"] == "django.core.cache.backends.locmem.LocMemCache":
    raise ImproperlyConfigured("Configure a shared CACHE_URL for authentication throttling in production.")

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
# Only configure SECURE_PROXY_SSL_HEADER with a trusted proxy that strips client headers.
