# Patient features — 7 November 2026

## Current scope

The patient experience uses Django records for profile editing, care preferences, emergency contact, booking counts, saved pins, booking conversations, attachments, appointment progress, reschedule requests, session reviews, notification inbox and support requests. Sample conversations, emergency contacts, addresses and patient statistics have been removed.

The owner confirmed direct ownership and Daraja access for Paybill **4125123**, account name **PhysioHome**, and selected M-Pesa STK Push. Pricing is now implemented: one 60-minute session costs KES 2,000 for 1 to under 3 years, KES 3,000 for 3 to under 5 years, KES 3,500 for 5+ years, or one exact admin-approved consultant rate between KES 3,500 and 4,500. Travel inside the provider's coverage radius is included. Selecting multiple care services does not multiply this total.

Provider pricing is reviewed in Django Admin, with reviewer, timestamp and a note documenting verified experience/consultant credentials. Signup cannot grant a tier or set a rate. Providers with unreviewed prices, including existing accounts migrated without a tier, do not receive new requests until reviewed. Less-than-one-year applicants are not assigned a paid tier by this policy. Historical bookings keep their existing amount, including a blank legacy quote; the migration does not invent historical charges.

Patients choose a maximum total before automatic matching; discovery and dispatch enforce that budget. Direct provider selection displays and submits the exact expected rate, and rejects a stale rate rather than silently charging a changed price. Offers snapshot their price and acceptance copies that price to the booking. Later provider-rate changes and approved rescheduling do not change the accepted amount.

The STK adapter and patient checkout action are implemented, but live payment collection remains disabled. Patients pay the frozen server-side quote after provider acceptance. The app creates idempotent payment intents, sends `CustomerPayBillOnline` requests to Daraja, and verifies outcomes through authenticated STK Query calls. Callbacks are correlated using per-attempt random tokens and stored checkout/merchant IDs; they only accelerate verification and never prove payment by themselves. The background worker and active payment screens reconcile pending results. The booking becomes `confirmed` only after server verification. Enabling `MPESA_ENABLED` also gates departure until payment is verified.

A pending/ambiguous payment blocks a second payment intent and cancellation. If initiation times out before a checkout ID is recovered, the attempt stays `unknown` and requires administrator reconciliation; it must not be reset and blindly charged again. Verified terminal failures permit a new attempt. Cancellation after verified payment records `refund_required` for administrator action; there is no automatic refund, provider payout or receipt-number verification implemented. Refund policy and operational reconciliation must be agreed before production enablement.

Set `MPESA_ENVIRONMENT=sandbox`, the sandbox test shortcode, consumer key/secret and passkey, plus `MPESA_CALLBACK_ORIGIN` as the public HTTPS API origin. Sandbox uses its test shortcode rather than the real Paybill. Production uses the approved production Daraja credentials and `MPESA_SHORTCODE=4125123`; `AccountReference` is `PhysioHome`. Keep all credentials in `backend/.env`, never in the Expo bundle or chat. Turn on `MPESA_ENABLED` only after sandbox verification, HTTPS deployment and refund/reconciliation readiness. No real STK requests were made during development; tests mock Daraja.

Support email and phone setup are also deferred. Patients can submit an in-app support ticket, view its status, and read booking guidance. Platform administrators review and resolve tickets in Django Admin. There is no automatic email, external support integration or promised response time.

## Profile and saved locations

`GET/POST /api/v1/patient/profile/` reads/updates the authenticated patient's name, phone, email, optional date of birth, gender, mobility needs, communication preference, care notes and emergency contact. Contact changes require the current password and retain unique email/phone validation. Blank optional clinical fields remain blank rather than showing invented data. Counts derive from actual bookings and saved locations.

`GET/POST /api/v1/patient/locations/` manages up to ten owner-scoped pins. The location name is a short nickname, not a typed address. Pins come from foreground GPS or map selection and can be edited/deleted. Booking can reuse a saved pin. Existing appointments retain their original pin if a saved location changes.

`POST /api/v1/patient/password/` validates the current and new passwords, changes the password and revokes all sessions. The app returns to sign-in. The privacy screen describes current data sharing; a formal privacy policy and retention rules still need to be supplied before launch.

## Appointment workflow

The assigned approved physiotherapist progresses an accepted booking through `en_route`, `arrived`, `in_progress`, then `completed`. Calls must follow that order. Repeating the current step is idempotent. Progress cannot begin more than two hours before a scheduled visit. Every transition records its actor and timestamp and creates a patient notification. Active workflow states reserve the slot; completion/cancellation releases it. Exact pin and patient contact sharing end when the appointment is completed or cancelled.

For an upcoming accepted appointment, the patient proposes a new time using the date/time picker. The existing slot remains reserved while the request is pending. Only the assigned approved provider can accept or decline. Acceptance rechecks future time, care services, coverage, availability and booking conflicts under the same provider lock used for acceptance. Cancellation or progress closes an outstanding time change. Changing location/care services requires a separate booking rather than silently changing an accepted visit.

Only the booking's patient can submit a review, only after completion, with a rating from one to five. One review is allowed per session. Reviews currently appear on that appointment; aggregate public provider ratings are not yet implemented.

Workflow endpoints:

- `POST /api/v1/bookings/{id}/reschedule/`: propose `starts_at`.
- `POST /api/v1/bookings/{id}/reschedule/{accept|decline}/`: provider response.
- `POST /api/v1/bookings/{id}/progress/{en_route|arrived|in_progress|completed}/`: provider update.
- `POST /api/v1/bookings/{id}/review/`: patient `rating` and optional `comment`.

## Private conversations and attachments

Conversations are linked to accepted appointments, not arbitrary accounts or fictional online contacts. Both participants can read their appointment messages and send messages while the appointment is active or completed. Cancellation leaves the history readable but prevents new messages. A provider whose professional approval is withdrawn cannot use the chat API. Server queries restrict every conversation, search and attachment to its participants.

Messages use UUID client IDs to prevent duplicate sends on retry. They expose sent/read timestamps, include pagination for older messages, and support text/filename search. The conversation list can be filtered by name or the latest message. Sending/searching does not imply diagnosis or automatic clinical advice. Active screens poll every eight seconds and stop in the background.

PDF, PNG and JPEG attachments are limited to 5 MB. The server checks file signatures, normalizes filenames/extensions and writes files under ignored `backend/private_uploads/`. Attachments are never served from a public media URL. Download retrieves content through an authenticated endpoint with `Cache-Control: no-store`; web downloads it and mobile uses the share sheet. Temporary native download files are removed after sharing. Production must provide durable private storage, backup, retention and scanning policies; uploaded clinical files should not be hosted in public static storage.

- `GET /api/v1/conversations/`: participant's most recent 50 booking conversations and unread counts.
- `GET/POST /api/v1/bookings/{id}/messages/`: paginated messages / send with `client_id`, optional `text` and optional `filename` + base64 `content`.
- `POST /api/v1/bookings/{id}/messages/search/`: search with `query` in the request body.
- `GET /api/v1/bookings/{id}/messages/{message_id}/attachment/`: private download.

## Push notifications and background processing

The notification inbox remains available on web and mobile. Native users explicitly opt in from Notifications. Registration checks a physical device, a development/production build, EAS project ID and notification permission. Android uses the `appointments` channel. Web and Expo Go explain the limitation rather than claim registration succeeded. Tapping a native push opens the notification inbox, which reads authoritative state from Django.

Tokens belong to an authenticated server session. On native app resume, an already-consented phone with permission is re-registered silently for the current session; a manual registration button also allows retries. Queue delivery checks consent, active device/account, token ownership and session expiry/revocation. Changing accounts on a device discards old queued pushes. Disabling notifications deactivates the patient's devices and queued deliveries. Lock-screen push text is generic and contains no symptom, message, exact location or contact information.

The database outbox retries service failures up to three attempts and checks Expo delivery receipts. Invalid device tokens are deactivated. Delivery tickets are not represented as proof that a person read a notification.

Configure `EXPO_PUBLIC_EAS_PROJECT_ID` for the app and APNs/FCM credentials in EAS. Set `EXPO_PUSH_ENABLED=True` on the server when ready, and optionally `EXPO_PUSH_ACCESS_TOKEN` if push security is enabled for the EAS project. Do not paste credentials into chat or commit them. Native plugin changes require a new development/production build. Actual device delivery cannot be verified until those credentials/builds exist.

After migrations, local background processing can run with:

```bash
docker compose --profile patient-worker up -d patient-worker
```

The worker advances dispatch/expiry and processes the outbox every 30 seconds, independently of active patient screens. Push delivery stays disabled without configuration. For a single pass:

```bash
docker compose exec api python manage.py patient_worker --once
```

Production needs a supervised worker process and shared cache for write throttles. General patient writes are limited to 30/minute and chat sends/searches to 60/minute per account.

## Verification

83 Django/PostGIS tests passed, including profile/contact validation, saved-pin isolation, chat and attachment ownership, read states, pagination, invalid uploads, message retry deduplication, cancellation, workflow ordering, review eligibility, reschedule conflicts, concurrent reschedule/acceptance, password/session revocation and push outbox/receipt behavior with mocked network delivery.

Physical-device picker, file sharing, notification permission and actual APNs/FCM delivery remain release checks. Payment integration awaits credentials and its verified transaction workflow. Support email remains deferred. Neither is a completed integration.

Live browser checks passed with separate synthetic patient/provider accounts: profile persistence, emergency contact, saved GPS pin and reuse, provider-approved rescheduling, two-way messages, PDF upload and authenticated download, message search, arrival/session transitions, review submission, real counts, support ticket and completion notification. The synthetic accounts, bookings and attachment were removed afterward. TypeScript, lint, five client-session tests, four scheduling tests, Django system/migration checks and web/Android exports passed.

Pricing/STK verification: 92 Django tests passed, including reviewed pricing, budget limits, stale direct quotes, frozen offer/booking prices, multi-service flat rates, ownership, amount validation, duplicate attempts, unknown network outcomes, forged callbacks, verified success, terminal failure, progress gating and refund-required cancellation.

A live browser regression also confirmed a reviewed KES 3,000 quote, disabled checkout without configuration, and the profile-to-review patient journey. Test accounts and attachments were removed; no real payment requests or payment records were created by that browser check. Web and Android exports, TypeScript, lint and migration checks passed.
