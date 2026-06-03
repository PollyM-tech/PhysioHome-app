import {
  appendSetCookieHeaders,
  buildClearCookieHeaders,
  resolveCookieDomain,
} from "@/lib/security/cookies";
import { hasValidCsrfToken } from "@/lib/security/csrf";
import { jsonFailure, jsonSuccess } from "@/lib/security/api-response";

export function DELETE(request: Request): Response {
  try {
    const domain = resolveCookieDomain(request);

    if (!hasValidCsrfToken(request)) {
      const headers = appendSetCookieHeaders(
        new Headers(),
        buildClearCookieHeaders(domain),
      );

      headers.set("Cache-Control", "no-store");

      return jsonFailure(
        "Your session has expired. Please sign in to continue.",
        403,
        { headers },
      );
    }

    const headers = appendSetCookieHeaders(
      new Headers(),
      buildClearCookieHeaders(domain),
    );

    headers.set("Cache-Control", "no-store");

    return jsonSuccess(
      {
        message: "You have been signed out.",
      },
      { headers },
    );
  } catch {
    return jsonFailure(
      "Something went wrong on our end. Our team has been notified. Please try again or contact support.",
      500,
    );
  }
}
