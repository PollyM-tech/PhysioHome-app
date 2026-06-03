const PRODUCT_COOKIE_PREFIX = "__physiohome_";

export const CSRF_HEADER_NAME = "x-physiohome-csrf";

export const COOKIE_NAMES = {
  session: `${PRODUCT_COOKIE_PREFIX}session`,
  tenant: `${PRODUCT_COOKIE_PREFIX}tenant`,
  csrf: `${PRODUCT_COOKIE_PREFIX}csrf`,
  onboarding: `${PRODUCT_COOKIE_PREFIX}onboarding`,
  temporary: `${PRODUCT_COOKIE_PREFIX}temporary`,
} as const;

export const COOKIE_MAX_AGE_SECONDS = {
  session: 60 * 60 * 24,
  rememberMe: 60 * 60 * 24 * 30,
  onboarding: 60 * 60 * 24 * 7,
  csrf: 60 * 15,
  temporary: 60 * 15,
} as const;

type SameSite = "lax" | "strict";

type CookieOptions = {
  domain: string;
  expires?: Date;
  maxAge: number;
  sameSite?: SameSite;
};

const COOKIE_DOMAIN_ENV = "PHYSIOHOME_COOKIE_DOMAIN";

export function resolveCookieDomain(request: Request): string {
  const configuredDomain = getServerEnv(COOKIE_DOMAIN_ENV);

  if (configuredDomain) {
    return sanitizeCookieDomain(configuredDomain);
  }

  return sanitizeCookieDomain(new URL(request.url).hostname);
}

export function buildSetCookieHeader(
  name: string,
  value: string,
  options: CookieOptions,
): string {
  const expires =
    options.expires ?? new Date(Date.now() + options.maxAge * 1000);
  const sameSite = options.sameSite ?? "lax";

  return [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${options.maxAge}`,
    `Expires=${expires.toUTCString()}`,
    "Path=/",
    `Domain=${options.domain}`,
    "HttpOnly",
    "Secure",
    `SameSite=${sameSite}`,
  ].join("; ");
}

export function buildClearCookieHeaders(domain: string): string[] {
  return Object.values(COOKIE_NAMES).map((name) =>
    buildSetCookieHeader(name, "", {
      domain,
      expires: new Date(0),
      maxAge: 0,
    }),
  );
}

export function buildCsrfCookieHeader(token: string, domain: string): string {
  return buildSetCookieHeader(COOKIE_NAMES.csrf, token, {
    domain,
    maxAge: COOKIE_MAX_AGE_SECONDS.csrf,
    sameSite: "strict",
  });
}

export function appendSetCookieHeaders(
  headers: Headers,
  cookies: string[],
): Headers {
  cookies.forEach((cookie) => headers.append("Set-Cookie", cookie));
  return headers;
}

export function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((part) => part.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  if (!match) return null;

  return decodeURIComponent(match.slice(name.length + 1));
}

function sanitizeCookieDomain(domain: string): string {
  const normalized = domain.trim().toLowerCase().replace(/^\./, "");

  if (!/^[a-z0-9.-]+$/.test(normalized) || normalized.length === 0) {
    throw new Error("Invalid cookie domain configuration");
  }

  return normalized;
}

function getServerEnv(name: string): string | undefined {
  const serverProcess = globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  };

  return serverProcess.process?.env?.[name];
}
