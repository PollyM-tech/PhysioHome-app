# PhysioHome Django backend

Python 3.14, Django 5.2 LTS, Django REST Framework, PostgreSQL 17 and PostGIS 3.5. Python package versions, including transitive dependencies, are pinned in `requirements.txt`. Native GDAL/GEOS/PROJ dependencies are provided by the development Docker image.

## First run with Docker (recommended)

Run these commands from the repository root. Docker Engine and Docker Compose are required.

```bash
cp backend/.env.example backend/.env
```

Replace both placeholder secrets in `backend/.env` with generated values. You can generate a value with `python3 -c 'import secrets; print(secrets.token_urlsafe(64))'`. Do not commit `.env`. If setup has already generated this file, keep the existing values.

```bash
docker compose build api
docker compose up -d db
docker compose run --rm api python manage.py migrate
docker compose run --rm api python manage.py createsuperuser
docker compose up -d api
```

The database image initializes the PostGIS extension. The account model is defined before the initial migration. Local database credentials belong only to this development database; production must use a separately provisioned database and least-privilege account.

Endpoints:

- `http://localhost:8001/api/v1/health/` — unauthenticated process liveness, without a database query.
- `http://localhost:8001/api/v1/ready/` — database/PostGIS readiness; returns 503 on failure.
- `http://localhost:8001/admin/` — Django administration, using the superuser created above.

```bash
docker compose run --rm api python manage.py check
docker compose run --rm api python manage.py makemigrations --check --dry-run
docker compose run --rm api python manage.py test
docker compose logs api
docker compose down
```

`down` preserves database data. Changing the database password in `.env` does not change a password inside an already initialized database volume; update the database role deliberately if credentials must change.

Docker ports bind to loopback by default. The API uses host port 8001 (container port 8000); override the host port with `PHYSIOHOME_API_PORT` if needed. The host database port defaults to 5433 to avoid common PostgreSQL conflicts. If port 5433 is occupied, set `PHYSIOHOME_DB_PORT=5434` in the shell before Compose commands; API-to-database traffic still uses port 5432 inside Docker. For native Python, also set `POSTGRES_PORT` in `backend/.env` to the chosen host port.

## Native Python development

Use Python 3.14. Install PostgreSQL/PostGIS and the GeoDjango native libraries (GDAL, GEOS and PROJ) on the host, or use the Docker database with host GIS libraries installed.

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Native `runserver` uses port 8000 by default. The host database connection defaults to `127.0.0.1:5433`; edit `backend/.env` to match the database. Django reads `backend/.env` without overwriting shell environment variables.

## Configuration and boundaries

- `config/settings/base.py`: shared settings and PostGIS database configuration.
- `config/settings/development.py`: local debugging and console email.
- `config/settings/production.py`: HTTPS defaults and explicit host requirements. ASGI and WSGI entry points default to this module; `manage.py` defaults to development.
- `apps/accounts/`: custom Django user, roles, account status, and admin registration.
- `apps/core/`: versioned health endpoints and integration tests.

Django username login is reserved for internal administration. The app uses email/phone and password with Simple JWT and revocable server-side sessions. Native refresh credentials use SecureStore; browser refresh credentials use an HTTP-only, CSRF-protected cookie. REST endpoints require authentication by default; health/readiness and credential/recovery endpoints explicitly allow anonymous callers. See [authentication and authorization](../Docs/AUTHENTICATION.md) for the API and security model.

The custom user has patient, physiotherapist and admin roles. Django Admin requires both staff authorization and the admin role. Superuser creation assigns the admin role. Suspended users must also have `is_active=False`, enforced by model validation and a database constraint. Provider approval uses a separate application and manual review action; account creation does not verify a physiotherapist.

The public registration API creates patient/provider accounts and always starts providers pending review. No public API accepts role changes. Future APIs must enforce object ownership and role-specific permissions. Clinical data, uploads, full document verification, bookings, location models, payments and push delivery are subsequent work. Basic provider approval and Expo authentication integration are implemented.

## Connecting the mobile app

Set the frontend's `EXPO_PUBLIC_PHYSIOHOME_API_ORIGIN` to the backend origin for the API client. A physical phone cannot use `localhost` to reach your computer. For device testing, deliberately expose the development server through a suitable LAN binding or development tunnel, add the host to `DJANGO_ALLOWED_HOSTS`, and use that origin. Expo web also needs its exact origin in `CORS_ALLOWED_ORIGINS`. CORS does not authenticate a caller.

## Production

The Compose file and `runserver` are for local development. Production needs an appropriate WSGI/ASGI server, TLS termination, static-file serving, restricted database access, backups, monitoring, and deployment-specific settings. Do not deploy the development Compose stack unchanged.

Set `DJANGO_SETTINGS_MODULE=config.settings.production`, a unique `DJANGO_SECRET_KEY`, explicit `DJANGO_ALLOWED_HOSTS`, and production database settings. Run `python manage.py check --deploy` with those settings. Only enable a proxy SSL header when the trusted proxy sanitizes forwarded headers. Production also requires an HTTPS `PUBLIC_API_ORIGIN`, SMTP settings for password recovery, and a shared `CACHE_URL` for authentication throttling. For `CACHE_URL=dbcache://physiohome_cache`, run `python manage.py createcachetable`. Background workers and file storage will be added with their features.
