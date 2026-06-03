import {
  appendSetCookieHeaders,
  buildCsrfCookieHeader,
  resolveCookieDomain,
} from "@/lib/security/cookies";
import { createCsrfToken } from "@/lib/security/csrf";
import { jsonFailure, jsonSuccess } from "@/lib/security/api-response";

export function GET(request: Request): Response {
  try {
    const domain = resolveCookieDomain(request);
    const csrfToken = createCsrfToken();
    const headers = appendSetCookieHeaders(new Headers(), [
      buildCsrfCookieHeader(csrfToken, domain),
    ]);

    headers.set("Cache-Control", "no-store");

    return jsonSuccess({ csrfToken }, { headers });
  } catch {
    return jsonFailure(
      "Something went wrong on our end. Our team has been notified. Please try again or contact support.",
      500,
    );
  }
}
