# Authentication and authorization

Implemented with Django password authentication, Django REST Framework and Simple JWT. WorkOS is not part of the current authentication implementation. Django Admin retains its separate CSRF-protected browser session login.

## Public account flows

Patients and physiotherapists can register using full name, email, phone, password, selected role and terms agreement. Provider registration also saves license number, one to three offered services and experience in a pending provider application, and requires confirmed geographic coverage (`coverage`: label, latitude, longitude, radius_km). Coverage always starts offline. See [booking and matching](BOOKING_AND_MATCHING.md). Registration does not verify a phone number, email address or professional license.

Email is normalized to lowercase; phone numbers are validated and normalized to E.164, with Kenya as the default region for national numbers. Non-empty emails are unique without regard to case, and normalized non-empty phone numbers are unique at database level. Admin username login remains available separately. Public users cannot assign staff/superuser privileges, request an admin role or approve themselves.

Password validation uses Django's similarity/common-password/numeric checks, an eight-character minimum and 128-character maximum, and the uppercase/number/special-character requirements shown in the signup screens. Passwords are stored using Django's configured hashers, never as plaintext. Terms acceptance is recorded with a timestamp; versioned legal acceptance is future work.

## Session lifecycle

Access JWTs expire after five minutes. Refresh JWTs have a seven-day absolute lifetime and rotate on use. Each login creates an independent database-backed authentication session. Tokens contain a session ID; authenticated requests check the current user and session in the database instead of trusting role or account-status claims from a token.

Refresh rotation locks the session row so simultaneous attempts using the same refresh token cannot both succeed. Logout revokes the current session immediately, including its unexpired access token; other device sessions remain active. Expired or already revoked logout is idempotent. Password changes invalidate previously issued tokens; password reset additionally marks all application sessions revoked. Suspended/inactive accounts cannot log in, refresh or use existing access tokens.

The current API has no public role-change or profile-edit endpoint. Future domain endpoints must use the role permissions and filter records to authorized participants. Client route guards are navigation aids; backend authorization remains mandatory.

## Native and browser storage

Native applications store only the refresh token in Expo SecureStore. The access token is held in memory. Web applications keep the access token in memory and use a path-scoped HTTP-only refresh cookie. No token is stored in localStorage or AsyncStorage.

Browser registration/login use `transport: "cookie"`; refresh tokens are then omitted from JSON responses. Cookie-based login, registration, refresh and logout require Django CSRF validation. Obtain a CSRF token from the endpoint below and send `X-CSRFToken`, with credentials included. Cookies use SameSite=Lax, and refresh cookies are Secure outside development. Deploy frontend and API on a compatible same-site HTTPS setup or use a same-origin proxy; arbitrary cross-site hosting requires a deliberate cookie/CSRF design.

Native registration/login use `transport: "token"` (the default) and receive a refresh token in JSON. Native refresh/logout send it explicitly in the request body. API requests use `Authorization: Bearer <access>`. API responses containing credentials are marked `Cache-Control: no-store`.

The client restores sessions on launch, serializes refresh attempts within the app process, retries an API request once after refreshing an expired access token, and checks current account state on app resume. Network failures are retryable. Signing out requires a server response so the UI does not falsely claim a remote session has been revoked while offline.

## API

| Method | Path | Request / behavior |
| --- | --- | --- |
| GET | `/api/v1/auth/csrf/` | Returns `csrfToken` and establishes the CSRF cookie |
| POST | `/api/v1/auth/register/` | Registration fields; returns user, access token, and native refresh token |
| POST | `/api/v1/auth/login/` | `identifier` (email or phone), `password`, `role`, optional `transport` |
| POST | `/api/v1/auth/refresh/` | Native `refresh` body field, or browser cookie + CSRF; rotates refresh token |
| POST | `/api/v1/auth/logout/` | Native `refresh` body field, or browser cookie + CSRF; revokes session |
| GET | `/api/v1/me/` | Current user's safe identity, role, account status and provider verification status |
| POST | `/api/v1/auth/password-reset/` | `email`; generic response whether or not an eligible account exists |
| GET/POST | `/auth/reset/<uid>/<token>/` | Django recovery form reached through the email link |

Invalid credentials, expired/replayed tokens and revoked sessions return 401. Authenticated permission failures and missing/invalid CSRF return 403. Validation errors return 400; rate limits return 429. No patient/provider business endpoints are implemented yet.

## Roles and provider approval

Reusable permissions are in `backend/apps/accounts/permissions.py`: active account, patient, approved physiotherapist, platform admin, and account owner. They must be applied to future booking, payment and clinical-data endpoints; object permissions do not automatically filter list querysets.

The Expo patient routes require a patient account. Physiotherapist routes require an approved provider account. Pending, rejected, suspended or expired providers see their verification status and can check again or sign out. The current-user endpoint remains accessible to active pending providers so they can check their status.

Django Admin requires an active staff account with the admin role. Provider applications are read-only for submitted identity/professional details. An authorized admin saves a review note and uses an explicit approve/reject/suspend action after performing the appropriate manual checks. The action records the reviewer, review time and a before/after change entry in Django's admin audit log. Secure credential uploads and the full verification operations workflow remain future work; this is the initial approval gate.

## Recovery and service configuration

Development reset emails are printed to `docker compose logs api`; no real email is sent. Production must configure SMTP with `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS` and `DEFAULT_FROM_EMAIL`. `PUBLIC_API_ORIGIN` controls the trusted origin in reset links; production requires HTTPS. Reset links expire after one hour and become invalid after successful use. Email delivery must be configured and checked before enabling this flow for real users.

The root `.env.example` documents `EXPO_PUBLIC_PHYSIOHOME_API_ORIGIN`. Copy it to `.env.local` and use an address reachable from your device. Expo web defaults to `http://localhost:8001` when the variable is absent. Physical devices need a LAN/tunnel origin; add its host to Django's allowed hosts. Browser origins must be explicitly present in `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` where applicable.

Registration, login, refresh/logout and reset requests have scoped rate limits. Development uses a per-process memory cache. Production refuses that cache and requires a shared `CACHE_URL`, for example `dbcache://physiohome_cache`; run `python manage.py createcachetable` before using the database cache. Rate limiting is defense in depth, not a replacement for deployment-level abuse controls. Configure trusted proxy/IP handling when deploying behind a proxy.

Keep `DJANGO_SECRET_KEY` private and stable across API instances. Server clocks must be synchronized. Deployments should also schedule removal of expired authentication sessions, with retention appropriate to operational needs. Reset links and bearer tokens must not be logged. SMS OTP, social sign-in, email verification and MFA are not implemented. The old Expo server-side cookie-clearing endpoints were removed; Django now owns authentication.

## Validation

Backend tests cover role escalation, duplicate identities, credential failures, token rotation/replay, concurrent refresh, immediate logout, independent device sessions, suspension, password changes/reset, HTTP-only cookies, CSRF, throttling, owner checks, provider approval and its admin audit entry. The client session tests cover native/browser token storage, shared refresh requests, delayed responses after logout and retryable logout failures (`npm run test:auth-client`). Frontend validation also includes TypeScript, lint and Expo web export. A physical-device end-to-end pass is still required before release.
