# PhysioHome App

PhysioHome is a mobile-first healthcare marketplace connecting patients in Kenya with verified physiotherapists for home-based treatment, rehabilitation, and mobility support.

## Project status

The repository contains the Expo mobile app, authentication screens, patient and physiotherapist interfaces, and initial security helpers. Many screens currently use static data.

The backend architecture has been changed from Convex to **Python and Django**, with **PostgreSQL and PostGIS**. Authentication, geographic service coverage, availability and initial booking/matching flows are implemented. Payments, push delivery and broader clinical workflows remain pending. Convex dependencies and generated scaffolding have been removed from the repository.

## Languages and frameworks

| Layer | Language | Framework or service | Status |
| --- | --- | --- | --- |
| Mobile app | TypeScript / TSX | React Native 0.81, React 19, Expo SDK 54 | Existing |
| Navigation | TypeScript | Expo Router 6, built on React Navigation | Existing |
| Styling | TypeScript and CSS | NativeWind 4 / Tailwind CSS 3, React Native StyleSheet | Existing |
| Backend API | Python 3.14 | Django 5.2 LTS + Django REST Framework | Scaffolded |
| Database | SQL | PostgreSQL 17 with PostGIS 3.5 | Local Docker configuration provided |
| Geographic queries | Python / SQL | GeoDjango + PostGIS | Coverage, discovery and matching implemented |
| Internal operations | Python | Django Admin | Custom user registered |
| Authentication | Python / TypeScript | Django passwords + Simple JWT, native SecureStore, browser HTTP-only cookie | Registration, login, recovery, session renewal and guards implemented |
| Payments | Backend integration | M-Pesa Daraja API | Planned |
| Maps and routing | Mobile and backend integrations | Native maps, web maps, optional Google Places | Pin/GPS coverage implemented; full search needs configured keys; routing pending |
| Notifications | Mobile and backend integrations | Push notifications; delivery integration to be finalized | Planned |

Backend Python dependencies are pinned in `backend/requirements.txt`. Backend services are not installed by `npm install`. See [backend setup](backend/README.md) for Docker and native Python instructions.

## Architecture

The Expo app calls a versioned Django REST API for authentication. Django will enforce permissions, provider verification, booking transitions, pricing, payment validation, and administrative workflows. PostgreSQL will store application records; PostGIS will support nearby searches and geographic service coverage.

Device location is obtained by the mobile app with permission. Maps services provide address search, maps, and road travel estimates. PostGIS handles geographic matching; straight-line proximity must not be presented as a driving-time estimate.

See [Technology Stack and Architecture](Docs/TECHNOLOGY_STACK.md) for the current decision, backend organization, proposed API contracts, and migration scope. It supersedes the Convex-specific technical guidance in the original product specification.

## Documentation

Patients and physiotherapists select up to three services using checkboxes; matching requires the provider to offer all requested services.

The main booking experience is **Find someone available**, with **Choose a physiotherapist** as the alternative. Matching uses approved specialties, confirmed geographic coverage, availability and appointment conflicts.

- [Booking, coverage and matching](Docs/BOOKING_AND_MATCHING.md)
- [Authentication and authorization](Docs/AUTHENTICATION.md)
- [Current technology stack and architecture](Docs/TECHNOLOGY_STACK.md)
- [Product and engineering specification](<Docs/Physio Home Professional App Documentation.pdf>) — includes a backend revision notice; the original specification follows for product context.
- [Brand guideline](<Docs/Physio Home Brand Guideline.pdf>)
- [UI references](Docs/UIPages/)

The product scope and brand direction remain in effect. Backend examples using Convex are superseded by the current architecture reference.

## Local frontend development

Prerequisites: Node.js LTS, npm, and an Expo-compatible device or simulator.

```bash
npm install
cp .env.example .env.local
npx expo start
```

To clear the Metro cache:

```bash
npx expo start -c
```

Checks:

```bash
npm run typecheck
npm run lint
```

The entry route restores the session and opens the appropriate role area, or onboarding for signed-out users. Authentication routes are under `app/auth`, patient routes under `app/patient`, and provider routes under `app/physiotherapist`.

For the Django API and local PostGIS database, follow [backend setup](backend/README.md). Run the mobile frontend separately.

## Expo development requirement

Read the exact [Expo SDK 54 documentation](https://docs.expo.dev/versions/v54.0.0/) before changing application code, as required by `AGENTS.md`.

Keep `babel-preset-expo` on the SDK 54 compatible `~54.0.10` range. A newer SDK's preset can leave private class fields untransformed and prevent Android Hermes builds. After dependency changes, restart Metro with `npx expo start -c`.

Patient feature behavior, API routes, deferred payments and native push setup are documented in [Patient features](Docs/PATIENT_FEATURES.md). After pulling these changes, install dependencies and apply migrations:

```bash
npm install
docker compose run --rm api python manage.py migrate
npx expo start -c
```
