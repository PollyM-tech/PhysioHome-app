import { COOKIE_NAMES, CSRF_HEADER_NAME, readCookie } from "@/lib/security/cookies";

const CSRF_TOKEN_BYTES = 32;

export function createCsrfToken(): string {
  const bytes = new Uint8Array(CSRF_TOKEN_BYTES);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function hasValidCsrfToken(request: Request): boolean {
  const csrfHeader = request.headers.get(CSRF_HEADER_NAME);
  const csrfCookie = readCookie(request, COOKIE_NAMES.csrf);

  if (!csrfHeader || !csrfCookie) return false;

  return timingSafeEqual(csrfHeader, csrfCookie);
}

function timingSafeEqual(first: string, second: string): boolean {
  const maxLength = Math.max(first.length, second.length);
  let mismatch = first.length === second.length ? 0 : 1;

  for (let index = 0; index < maxLength; index += 1) {
    const firstCode = first.charCodeAt(index) || 0;
    const secondCode = second.charCodeAt(index) || 0;
    mismatch |= firstCode ^ secondCode;
  }

  return mismatch === 0;
}
