# Booking, provider coverage and availability

Current patient workflow, chat and push implementation is described in [Patient features](PATIENT_FEATURES.md). The dated implementation notes below record earlier stages.

Decision date: 7 November 2026. This specification supersedes the earlier text-only service-area field and provider-first booking assumptions in the original PDF (particularly sections 10, 15, 16 and 24).

## Booking experiences

**Find someone available** is the primary patient booking experience. The patient selects a care category, confirms their home-visit location, and chooses now or a future time. The system offers the request to a small group of eligible providers. A patient can instead select **Choose a physiotherapist**, browse eligible professionals, and request one directly. Both paths use the same authorization, coverage, scheduling and booking-state rules.

Matching is based on care category/specialty, professional approval, active account, coverage, availability and appointment conflicts. Requests are never dispatched randomly to unrelated professionals. The first valid acceptance wins atomically; other offers close. When nobody accepts, the patient can retry with other eligible providers, choose another time, or browse providers. Payment follows provider acceptance; payment success must still be validated by the payment integration.

## Provider service coverage

A provider chooses one service-area center using place search, a map pin or foreground device location, then confirms a 5, 10 or 15 km travel radius. Coordinates are saved in PostGIS as a WGS84 geographic point. The displayed area name is descriptive; eligibility depends on coordinates and radius, not text matching. Device movement never automatically changes the saved center. A provider may select a center different from their home or present location.

Availability is separate: **Available now**, **Scheduled appointments only**, or **Offline**. Going online requires an approved provider account and confirmed geographic coverage. New registrations default to offline. Providers must explicitly change their availability; GPS permission alone does not put them online. Current mode controls new incoming offers; going offline does not cancel an accepted appointment.

For this first implementation, a provider selecting scheduled-only is opting in to scheduled requests, subject to existing appointment conflicts. Detailed recurring working hours and leave blocks are a later availability extension. Sessions currently reserve 60 minutes; travel buffers are also a later scheduling extension. These limits must be visible in the provider availability settings.

Legacy providers with only a text service area must confirm a map location before receiving new requests. Migration must not guess coordinates from their text or silently put them online.

## Dispatch and acceptance

Automatic requests go first to up to three nearby eligible providers. After an offer window expires, another group can be tried. A request has a bounded search lifetime, after which the patient sees that no provider accepted. Requesting a specific provider creates an offer only for that provider, with no silent reassignment. Patient retries cannot create a second active matching booking on top of the original request.

The backend rechecks approval, account status, coverage, specialty and appointment conflicts at acceptance. Provider and booking locks prevent double acceptance and overlapping appointments, including requests accepted in parallel. Accepted bookings reserve the provider's time while payment is pending. Later payment expiry/cancellation policies must release reservations explicitly.

Providers see care category, approximate area, time and fee information (when configured) before acceptance. Exact patient coordinates and home-visit directions are disclosed only to the assigned provider after acceptance, and to the booking owner or authorized administrator. General provider discovery does not reveal service-area coordinates, private phone numbers, emails or identity documents.

## Location services

Foreground location requires consent and has a manual map/search fallback. Straight-line distance is used for geographic eligibility; it must not be labelled driving distance or travel time. Live background tracking is not included.

Mobile maps use the platform map SDK (Apple Maps on iOS, Google Maps on Android); the web map uses OpenStreetMap tiles with attribution. Full place search uses a server-configured Google Places key and a configured Google map renderer on that client. Google place results are displayed on Google maps, rather than mixed with the OpenStreetMap fallback. Without that key, a clearly labelled, limited Kenya-area directory remains available alongside manual map pins and foreground GPS; it must not pretend to search arbitrary streets. Public Nominatim is not used automatically. Android development/production builds need their own appropriately restricted map SDK key. Search is cached and rate-limited. A search/network failure must leave pin selection and retry options available. Driving routes/ETA remain separate from geographic coverage.

## Implementation boundaries

This work introduces geographic coverage, availability, patient discovery, request dispatch and provider acceptance. M-Pesa charging, routing/ETA, continuous tracking, recurring calendars, professional-document upload and full clinical care records remain separate features. The app must not claim that a provider was contacted or that a booking/payment succeeded before the backend confirms it.

The implementation status, API contracts and verification results will be recorded here once the changes are complete.

## Implemented API and screens

| Method | Path | Access and behavior |
| --- | --- | --- |
| GET | `/api/v1/catalog/` | Active accounts; stable care codes and session duration |
| GET | `/api/v1/locations/search/?q=...` | Rate-limited public search for registration; limited directory without configured Google map/search credentials |
| GET / POST | `/api/v1/provider/coverage/` | Current provider's coverage only; unapproved providers can save offline coverage |
| POST | `/api/v1/providers/discover/` | Patients; eligible providers for a care category, coordinates and optional future start time |
| GET / POST | `/api/v1/bookings/` | Patients; list own requests or create automatic/direct requests |
| POST | `/api/v1/bookings/{id}/cancel/` | Booking patient or assigned provider; release the appointment reservation |
| GET | `/api/v1/provider/offers/` | Approved providers; own open offers and accepted appointments |
| POST | `/api/v1/provider/offers/{id}/accept/` | Eligible offered provider; atomically accept and close other offers |
| POST | `/api/v1/provider/offers/{id}/decline/` | Offered provider; decline and advance to another eligible group when appropriate |

Search/discovery input is `label`, `latitude`, `longitude`, `services` (one to three distinct catalogue codes), and optional `starts_at` in ISO 8601 format. Creating a request additionally accepts private `directions` and optional `preferred_provider_id`. Absence of a preferred provider selects automatic matching. The booking mode is saved independently, so removing a selected provider never silently changes a direct request to automatic matching.

Provider registration now requires a `coverage` object containing `label`, `latitude`, `longitude` and `radius_km`. The server always creates that coverage offline. Existing account records with only a text service area are preserved and stay ineligible until a location is confirmed. Saving provider coverage requires the same fields plus `availability`.

The patient home screen has a primary matching CTA, a secondary provider-choice CTA, and care categories leading to the booking form. The Bookings tab now uses real provider discovery and booking state instead of fictional providers or bookings. Provider signup uses map-based coverage; `/coverage` allows later changes, including while verification is pending. The provider dashboard reads real coverage/request counts, and the Requests tab shows actual offers with accept/decline controls.

The first dispatch window offers a booking to at most three providers for 60 seconds. Booking search expires after five minutes. Active patient/provider screens poll every ten seconds and pause polling in the background. A patient can cancel an active search before replacing it. Full background dispatch/push infrastructure is not included; later waves and expiry are advanced by active requests/polling.

Accepted appointments reserve the slot in `payment_pending`. Fees are currently unset and shown as such; there is no charge, payout or paid confirmation. Cancellation releases the reservation. Future payment timeout, pricing and refund policies must be implemented before live charging.

## Configuration and local verification

- Run `npm install` after pulling the map/location dependencies, then restart Expo with `npx expo start -c`.
- Run `docker compose run --rm api python manage.py migrate` for the new PostGIS models.
- Set `GOOGLE_MAPS_API_KEY` in `backend/.env` for server-side Places API (New) searches.
- Set the appropriate client map key in `.env.local`: `EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY`, `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY`, or `EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY`.
- Restrict server and client keys separately to their required APIs and application/IP/referrer identities. Native configuration changes require a new development/production build. Expo Go supports its bundled map capabilities for development.
- Without matching client map and server search credentials, the app continues to use manual pins, foreground GPS and its labelled Kenya-area directory. The fallback is a small set of approximate area centers, not a complete address database.
- Web OpenStreetMap tiles include attribution. Automated checks should block external tile requests rather than pan/zoom the public tile service. Custom tile providers need appropriate attribution and usage terms.

Automated verification covers geographic distance/radius eligibility, specialty and availability filters, pending/suspended accounts, address redaction, direct selection, expiry, further dispatch groups, duplicate searches, cancellation, parallel acceptance and overlapping appointments. Existing authentication tests remain part of the regression suite.

### Verification completed — 7 November 2026

- 55 Django/PostGIS tests passed, including the authentication regression suite and 19 marketplace tests.
- Five client-session tests passed; TypeScript, lint, Expo web export and Django system/migration checks passed.
- Twelve live browser checks passed using synthetic accounts: clickable map pin, provider signup and radius persistence, offline default, approval gating, explicit availability, automatic dispatch, address privacy, acceptance polling, cancellation, chosen-provider requests and rejection. External map-tile requests were blocked during automation. Test accounts and their bookings were removed afterward.
- Google-backed search was not exercised with live credentials. Physical-device map/GPS checks remain necessary before release.

### Manual test

Use separate browser profiles (for example, a normal window and an incognito window) for the patient and provider. Register a provider, confirm a map pin/radius and obtain admin approval. Set the approved provider to Available now. Register a patient with the same care category and a visit pin inside that radius. Submit Find someone available, open the provider's Requests tab and accept within the offer window. Check that the patient sees acceptance, then cancel to release the slot. Repeat using Choose a physiotherapist. Offline or non-matching providers should not appear in discovery.

After changing map credentials, recreate the API container with `docker compose up -d --force-recreate api` and restart Expo with `npx expo start -c`. Keep private server keys in `backend/.env`; client map keys need their own platform restrictions.

## Service checkbox selection — 7 November 2026

Patients select one to three care services using checkboxes in both booking modes. Switching between automatic matching and choosing a provider preserves that selection. Provider signup uses the same three-service limit for services offered. Once three boxes are selected, other unchecked options are disabled; selected boxes remain enabled so a selection can be replaced.

Django validates the limit independently and rejects empty lists, more than three entries, duplicates and unknown service codes. A provider must offer **all** services selected for a request; the app does not split one request between several clinicians or match someone qualified for only part of the selection. The same rule is checked during discovery, dispatch, direct-provider requests and acceptance. Multiple care areas still belong to one session; session duration and pricing are not automatically multiplied.

New clients send `services`, for example `["spine", "sports", "knee"]`. Legacy single `specialty` requests remain accepted and normalize to a one-item array. Existing provider specialties and booking categories are migrated to their matching service codes without adding qualifications. Unknown legacy provider descriptions remain unmatched until reviewed. The legacy primary-specialty field is retained for compatibility; the services array is authoritative for matching and visible in admin review.

The regression suite now includes the three-service boundary, full-service matching, rejection of partial matches, acceptance rechecks and migration preservation of existing records.

Multi-service verification: 63 backend tests passed, including legacy migration preservation; five client-session tests passed. Live browser checks confirmed the checkbox limit/replacement behavior on provider signup and patient booking, selection preservation between booking modes, and exposed checked states for accessibility. The temporary test account was removed. TypeScript, lint and web export passed.

## Patient search, scheduling and notifications

The patient home symptom search finds related care categories from the existing catalogue. Selecting a result opens automatic booking with that service selected. This is a catalogue lookup, not a diagnosis; search text is submitted in a POST body and is not saved by this feature. `POST /api/v1/services/search/` accepts a `query` of 2–120 characters.

Patient booking confirms a visit pin using the map or foreground GPS. Typed location search and home-directions fields are removed from this patient form. Provider coverage still supports area search. Existing directions remain stored for older bookings, and the API accepts them for compatibility.

Scheduling uses separate browser date/time inputs and native Android/iOS pickers. All appointment choices and booking displays use Africa/Nairobi (UTC+03:00), independently of the device timezone. Requests must start at least five minutes ahead and within 90 days; invalid calendar dates are rejected. Each appointment reserves 60 minutes. Availability remains subject to provider coverage, services and overlapping bookings; no arrival-in-minutes promise is made.

The assigned physiotherapist receives the patient's name, phone and email only after accepting an active appointment. Open offers and unrelated providers do not receive these contacts or the exact pin. Accepted appointment cards provide call, email and Google Maps controls. Cancellation removes provider access to contacts and the exact pin through the booking API. A missing legacy phone number is shown honestly rather than replaced with an invented contact.

The notification bell opens an authenticated in-app inbox with real unread counts. Booking submission, acceptance, no-match, expiry and cancellation create deduplicated patient notifications. The inbox and bell poll every 15 seconds while focused and active; polling also advances the patient's pending searches. Notifications are not backfilled for historical bookings. This does not send operating-system push, SMS or email.

`GET /api/v1/notifications/` returns the patient's latest 50 notifications and total unread count. `POST /api/v1/notifications/read/` accepts either an `id` belonging to that patient or `all: true`. Both endpoints restrict access to patients and return `Cache-Control: no-store`.

Patient-flow regression verification includes 71 Django/PostGIS tests, five client-session tests and four scheduling tests. Run the scheduling checks with `npm run test:scheduling`. Native picker and GPS behavior still require physical-device verification.

Live browser verification confirmed the bell/inbox, symptom-to-service booking selection, foreground GPS pin, scheduled request timestamps, contact privacy before acceptance, contact/call/map controls after acceptance, notification events and clearing the unread badge. Checks used synthetic accounts and blocked external map tiles. Test accounts and their bookings were removed afterward. TypeScript, lint, web export and migration checks passed.

The Android Hermes export also passed after aligning the project's Babel preset with Expo SDK 54. This validates bundling; it does not replace physical-device picker/GPS testing.
