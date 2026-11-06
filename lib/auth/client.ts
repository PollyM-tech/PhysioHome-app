import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export type Account = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: "patient" | "physiotherapist" | "admin";
  account_status: "active" | "suspended";
  verification_status: string | null;
};
export type Registration = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role: "patient" | "physiotherapist";
  agreed_to_terms: boolean;
  license_number?: string;
  specialty?: string;
  experience?: string;
  service_area?: string;
};
type Tokens = { access: string; refresh?: string; user: Account };
const storageKey = "physiohome.refresh";
const web = Platform.OS === "web";
let access: string | null = null;
let authVersion = 0;
let refreshing: Promise<Account> | null = null;
const listeners = new Set<(account: Account | null) => void>();
export function subscribeAuth(listener: (account: Account | null) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function notify(account: Account | null) {
  listeners.forEach((listener) => listener(account));
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
function describeError(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(describeError).join(" ");
  if (value && typeof value === "object")
    return Object.entries(value)
      .map(([key, item]) =>
        ["detail", "non_field_errors"].includes(key)
          ? describeError(item)
          : `${key.replaceAll("_", " ")}: ${describeError(item)}`,
      )
      .join("\n");
  return "We could not complete the request. Please try again.";
}
async function request<T>(
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<T> {
  const origin =
    process.env.EXPO_PUBLIC_PHYSIOHOME_API_ORIGIN?.replace(/\/$/, "") ||
    (web ? "http://localhost:8001" : "");
  if (!origin)
    throw new Error(
      "Set EXPO_PUBLIC_PHYSIOHOME_API_ORIGIN to your Django server address before signing in.",
    );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${origin}/api/v1/${path}`, {
      method: body === undefined ? "GET" : "POST",
      credentials: web ? "include" : "omit",
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });
    const text = await response.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new ApiError(
        "The server returned an unexpected response. Please try again.",
        response.status,
      );
    }
    if (!response.ok) throw new ApiError(describeError(data), response.status);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(
      "We could not reach PhysioHome. Check your connection and server address, then try again.",
    );
  } finally {
    clearTimeout(timer);
  }
}
async function csrfHeaders(): Promise<Record<string, string>> {
  if (!web) return {};
  const result = await request<{ csrfToken: string }>("auth/csrf/");
  return { "X-CSRFToken": result.csrfToken };
}
async function remember(
  tokens: Tokens,
  expectedVersion: number,
): Promise<Account> {
  if (expectedVersion !== authVersion)
    throw new ApiError("Your session changed. Please try again.", 409);
  if (!web) {
    if (!tokens.refresh)
      throw new Error("The server did not return a refresh token.");
    await SecureStore.setItemAsync(storageKey, tokens.refresh, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  if (expectedVersion !== authVersion)
    throw new ApiError("Your session changed. Please try again.", 409);
  access = tokens.access;
  notify(tokens.user);
  return tokens.user;
}
async function clearLocal() {
  authVersion += 1;
  access = null;
  if (!web) await SecureStore.deleteItemAsync(storageKey);
  notify(null);
}
export async function login(
  identifier: string,
  password: string,
  role: "patient" | "physiotherapist",
) {
  const version = ++authVersion;
  return remember(
    await request<Tokens>(
      "auth/login/",
      { identifier, password, role, transport: web ? "cookie" : "token" },
      await csrfHeaders(),
    ),
    version,
  );
}
export async function register(data: Registration) {
  const version = ++authVersion;
  return remember(
    await request<Tokens>(
      "auth/register/",
      { ...data, transport: web ? "cookie" : "token" },
      await csrfHeaders(),
    ),
    version,
  );
}
async function refresh(): Promise<Account> {
  if (!refreshing) {
    const version = authVersion;
    refreshing = (async () => {
      const token = web ? null : await SecureStore.getItemAsync(storageKey);
      if (!web && !token) throw new ApiError("Please sign in.", 401);
      try {
        return await remember(
          await request<Tokens>(
            "auth/refresh/",
            web ? {} : { refresh: token },
            await csrfHeaders(),
          ),
          version,
        );
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 401 &&
          version === authVersion
        )
          await clearLocal();
        throw error;
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}
export async function restoreSession(): Promise<Account | null> {
  // A new native install should open onboarding without needing a running API.
  if (!web && !(await SecureStore.getItemAsync(storageKey))) return null;
  try {
    return await refresh();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
export async function apiRequest<T>(path: string, body?: unknown): Promise<T> {
  if (!access) await refresh();
  try {
    return await request<T>(path, body, { Authorization: `Bearer ${access}` });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    await refresh();
    return request<T>(path, body, { Authorization: `Bearer ${access}` });
  }
}
export async function currentAccount() {
  const version = authVersion;
  const account = await apiRequest<Account>("me/");
  if (version === authVersion) notify(account);
  return account;
}
export async function logout() {
  if (refreshing) {
    try {
      await refreshing;
    } catch {
      /* Revoke/clear below. */
    }
  }
  const token = web ? null : await SecureStore.getItemAsync(storageKey);
  try {
    await request(
      "auth/logout/",
      web ? {} : { refresh: token },
      await csrfHeaders(),
    );
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
  }
  await clearLocal();
}
export async function requestPasswordReset(email: string) {
  await request("auth/password-reset/", { email });
}
export function accountDestination(account: Account) {
  if (account.role === "patient") return "/patient/home" as const;
  if (
    account.role === "physiotherapist" &&
    account.verification_status === "approved"
  )
    return "/physiotherapist/home" as const;
  return "/auth/verification-pending" as const;
}
