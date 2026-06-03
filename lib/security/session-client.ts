import { CSRF_HEADER_NAME } from "@/lib/security/cookies";

type CsrfResponse = {
  csrfToken?: string;
  message?: string;
  success: boolean;
};

type SessionResponse = {
  message?: string;
  success: boolean;
};

const API_ORIGIN = process.env.EXPO_PUBLIC_PHYSIOHOME_API_ORIGIN?.replace(
  /\/$/,
  "",
);

export async function clearServerSessionCookies(): Promise<void> {
  const csrfToken = await requestCsrfToken();
  const response = await fetch(apiUrl("/api/session"), {
    credentials: "include",
    headers: {
      Accept: "application/json",
      [CSRF_HEADER_NAME]: csrfToken,
    },
    method: "DELETE",
  });
  const data = (await response.json()) as SessionResponse;

  if (!response.ok || !data.success) {
    throw new Error(
      data.message ?? "We could not verify your identity. Please sign in again.",
    );
  }
}

async function requestCsrfToken(): Promise<string> {
  const response = await fetch(apiUrl("/api/csrf"), {
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
    method: "GET",
  });
  const data = (await response.json()) as CsrfResponse;

  if (!response.ok || !data.success || !data.csrfToken) {
    throw new Error(
      data.message ?? "We could not verify your identity. Please sign in again.",
    );
  }

  return data.csrfToken;
}

function apiUrl(path: string): string {
  return API_ORIGIN ? `${API_ORIGIN}${path}` : path;
}
