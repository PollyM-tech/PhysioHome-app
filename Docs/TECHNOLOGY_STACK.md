# PhysioHome Technology Stack and Architecture

Decision date: 6 November 2026

Status: Django authentication, coverage/matching, patient profiles, private booking chat, appointment progress/rescheduling/reviews and push outbox implemented. M-Pesa STK Push selected (Paybill 4125123, PhysioHome); reviewed pricing and disabled-by-default STK integration implemented; credentials, sandbox verification and refund operations pending; device push credentials/build verification and routing remain pending. See [patient feature status](PATIENT_FEATURES.md).

This is the authoritative technology reference. It supersedes Convex-specific guidance in the original product specification, especially sections 21–25 and 30. Product scope, user journeys, business rules, security expectations, and brand guidelines remain applicable.

## Decision

Use **Python with Django and Django REST Framework**, backed by **PostgreSQL with PostGIS**, instead of Convex. Keep the existing **TypeScript, React Native, and Expo SDK 54** mobile application.

This choice supports the combination of geographic provider matching, relational booking and payment records, professional verification, reporting, and internal operations. Django Admin provides an initial internal interface, including manual provider approval with review notes and audit entries. Full document verification and broader operations workflows remain future work.

## Languages and frameworks

| Responsibility | Selected technology |
| --- | --- |
| Mobile application | TypeScript / TSX, React Native 0.81, React 19, Expo SDK 54 |
| Navigation | Expo Router 6, using React Navigation |
| Styling | NativeWind 4 / Tailwind CSS 3 and React Native StyleSheet |
| Backend | Python, Django |
| HTTP API | Django REST Framework, JSON over HTTPS |
| Persistence | PostgreSQL |
| Spatial storage and queries | PostGIS and GeoDjango |
| Initial internal administration | Django Admin |
| Payments | M-Pesa Daraja API, integrated server-side |

The foundation uses Python 3.14 and Django 5.2 LTS; exact Python package versions are pinned in `backend/requirements.txt`. Local development uses PostgreSQL 17 and PostGIS 3.5 through Docker Compose. Deployment remains pending. See [backend setup](../backend/README.md).

## System architecture

The mobile app calls `/api/v1/` endpoints served by Django. Django authenticates the caller, checks permissions, validates input, executes business rules, and persists changes in PostgreSQL. GeoDjango uses PostGIS for spatial queries.

External integrations provide payments, push notifications, maps, address lookup, and routing. Background workers will handle reminders, retries, and payment reconciliation; the worker framework and broker are not yet selected.

Start as one modular Django application deployment with domain-specific Django apps. Separate microservices are not required for the MVP.

## Frontend organization

Keep the existing `app/`, `components/`, `hooks/`, `constants/`, and `lib/` structure. Expo Router remains the navigation system; the old `src/screens/` example in product section 22 is illustrative rather than a required restructuring.

API access should be centralized and typed. Screens should not implement payment confirmation or provider authorization. Loading, empty, failed-request, and expired-session states must be explicit.

Zustand is an optional future choice for local client state, not an installed or required part of this decision. API state and refresh behavior will be chosen during integration.

## Location and matching

1. Request device location permission when needed; allow manual address and map-pin selection when permission is denied or GPS is unavailable.
2. Store patient-selected booking coordinates and address details, including useful home-visit directions.
3. Store provider service areas and an explicitly defined matching location. A provider's service base and their live device location are different concepts.
4. Use PostGIS spatial indexes and distance queries to find nearby providers and check whether a booking falls inside their coverage area.
5. Filter candidates by approved verification, specialty, availability, account status, and scheduling conflicts before ranking them.
6. Use a routing service for road distance and estimated travel time when needed. Geographic distance alone does not measure driving time.

Google Maps, Places, and Routes are the planned service family; exact mobile SDKs and API usage are pending. Continuous background tracking is not required for the initial nearby-provider search.

Restrict exact home addresses and provider coordinates to authorized workflows. Do not publish precise private locations in general discovery results. Location retention and tracking consent must be defined before continuous tracking is introduced.

## Backend organization

Domain structure below is the intended direction. `config/`, `apps/accounts/`, and `apps/core/` are scaffolded; the remaining domain apps will be introduced with their features:

```text
backend/
  manage.py
  config/
  apps/
    accounts/
    patients/
    providers/
    verification/
    services/
    availability/
    bookings/
    matching/
    payments/
    notifications/
    reviews/
    audit/
```

Use Django models and migrations instead of Convex collections and generated data-model types. Existing product entities remain relevant: users, patient profiles, provider profiles, verification documents, services, availability, bookings, payments, reviews, notifications, and audit logs.

Use relational foreign keys, explicit status choices, timezone-aware timestamps, unique transaction identifiers, and appropriate database constraints. Represent money using decimal values. Define the custom user model before initial migrations. Medical notes and verification documents require restricted access; files must use private storage with authorized access.

## API contracts

Replace product section 25's query/mutation/action contracts with REST endpoints. The following are proposed contracts, not implemented routes:

| Method and endpoint | Access | Purpose |
| --- | --- | --- |
| `GET /api/v1/me/` | Authenticated user | Current account and role-specific profile summary |
| `PATCH /api/v1/me/` | Account owner | Update permitted personal fields |
| `GET /api/v1/services/` | Patient discovery policy | Active services |
| `GET /api/v1/providers/` | Patient discovery policy | Approved providers, filtered by service and location |
| `POST /api/v1/provider-verifications/` | Physiotherapist | Submit verification materials |
| `POST /api/v1/bookings/` | Active patient | Validate and create a booking request |
| `GET /api/v1/bookings/{id}/` | Authorized participant or admin | Booking details and current status |
| `POST /api/v1/bookings/{id}/accept/` | Eligible approved physiotherapist | Accept without creating a scheduling conflict |
| `POST /api/v1/bookings/{id}/cancel/` | Authorized participant or admin | Apply cancellation and refund rules |
| `POST /api/v1/bookings/{id}/complete/` | Authorized assigned physiotherapist | Complete an eligible session |
| `POST /api/v1/bookings/{id}/reviews/` | Booking patient | Review a completed session |
| `POST /api/v1/payments/mpesa/initiate/` | Booking patient | Initiate payment for the server-calculated amount |
| `POST /api/v1/payments/mpesa/callback/` | External payment provider | Process and validate the payment result |

Registration and login endpoints depend on the authentication design. Never accept a public registration request that grants an admin role. Profile creation must bind identity fields to the authenticated identity rather than trusting arbitrary client identifiers.

Preserve the original booking lifecycle and payment statuses. Backend services must enforce allowed state transitions, record ownership, provider verification, cancellation rules, and review eligibility. Use database transactions and suitable locking or constraints to prevent concurrent acceptance and overlapping bookings.

Payment callbacks must be processed idempotently, correlated with server-created payment records, and validated using the payment provider's supported mechanisms. A client screen or an untrusted callback payload must not independently establish payment success. Record attempts separately from the booking and provide reconciliation for delayed or missing results.

## Authentication and permissions

Authentication now uses Django passwords and Simple JWT with revocable server-side sessions. WorkOS is not integrated. The Expo screens support registration, email/phone login, logout, session restoration and password-reset requests. Native refresh tokens use SecureStore; browser refresh uses an HTTP-only cookie and CSRF protection. See [authentication and authorization](AUTHENTICATION.md) for contracts, permissions and configuration.

Django must enforce patient, physiotherapist, and admin permissions on every protected operation, including object ownership. Unapproved providers cannot accept bookings. Admin access requires staff authorization and stronger account protection; sensitive actions need audit records. Browser session flows require CSRF protection; native authentication must have a deliberate secure credential-storage design.

## Updates and notifications

Convex reactive subscriptions will not be part of the new architecture. For the MVP, use explicit API refreshes and bounded polling while a booking or payment is active, complemented by push notifications. Refetch authoritative state after notification delivery or app resume. Design polling to stop when the screen is inactive or the workflow reaches a terminal state.

WebSockets can be introduced if live tracking or chat requires them. Push delivery is not a substitute for authoritative backend state. Notification transport, background-worker technology, and any WebSocket implementation remain open implementation decisions.

## Administration

Use Django Admin for initial provider review, account oversight, booking lookup, and payment visibility. Implement controlled workflow actions rather than allowing arbitrary status edits. Preserve actor, timestamp, reason, and relevant before/after state for sensitive changes. A dedicated operations dashboard may follow as workflows become more complex.

## Environments and deployment

Maintain separate development, staging, and production environments. The backend will require its own Python dependencies and configuration, PostgreSQL connection settings, private storage configuration, authentication settings, M-Pesa credentials, notification credentials, and maps configuration. Worker settings will be added once selected.

Keep backend secrets out of the Expo bundle and source control. Public mobile configuration must contain only values suitable for distribution. Use least-privilege access, encrypted connections, backups, restore checks, structured logging, and monitoring. Hosting and backup providers are not selected yet.

## Migration scope and status

Convex cleanup is complete: the npm dependency, its lockfile entries, and the entire `convex/` scaffolding directory have been removed. No Convex imports or configuration remain in application code. Historical references in product documentation describe the superseded architecture. The Django settings, custom user model, admin registration, health endpoints, and local Docker/PostGIS configuration are scaffolded. Domain implementation and external service provisioning are still pending.

Implementation sequence:

1. Scaffold Django and pin compatible Python/framework dependencies (foundation added).
2. Configure PostgreSQL/PostGIS, the custom user model, and migrations (foundation added).
3. Implement authentication and role/object permissions (implemented; apply permissions to each future domain endpoint).
4. Implement provider profiles, private verification uploads, and admin approval.
5. Implement geographic discovery, availability, and booking lifecycle rules.
6. Integrate M-Pesa initiation, callbacks, reconciliation, and notifications.
7. Connect the Expo screens to the Django API.
8. Verify permission boundaries, geographic queries, concurrent bookings, payment retries and duplicate callbacks, and critical mobile journeys.

The brand guideline is unchanged. The product PDF includes a revision notice directing readers here for the current technology decision; its original pages retain the historical product planning context.

## Technical references

- [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/)
- [Django documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [GeoDjango](https://docs.djangoproject.com/en/5.2/ref/contrib/gis/)
- [PostGIS](https://postgis.net/documentation/)

Versioned Django references explain the architecture; they do not pin the implementation version.

## Booking experience revision — 7 November 2026

The primary booking flow automatically finds an eligible available physiotherapist. Direct provider selection remains supported. Provider coverage is a confirmed geographic center plus travel radius, separate from availability and current GPS position. [Booking and matching](BOOKING_AND_MATCHING.md) supersedes earlier provider-first, free-text coverage and random-dispatch assumptions. The web map uses attributed OpenStreetMap tiles; mobile uses platform maps. Full place lookup uses configured Google Places credentials, with a limited Kenya-area directory and manual pins/GPS available without credentials. External routing remains separate.
