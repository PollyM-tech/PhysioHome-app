import { Platform } from "react-native";
import { apiRequest, publicApiRequest } from "@/lib/auth/client";

export type Place = { label: string; latitude: number; longitude: number };
export type Mode = "available_now" | "scheduled_only" | "offline";
export type Coverage = {
  session_fee?: number | null;
  label: string;
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
  availability: Mode;
  confirmed: boolean;
};
export type Specialty = { code: string; label: string };
export type Booking = {
  id: string;
  specialty: string;
  services: string[];
  service: string;
  status: string;
  scheduled: boolean;
  starts_at: string;
  ends_at: string;
  quoted_fee: string | null;
  provider_name: string | null;
  patient_contact?: { full_name: string; phone: string; email: string };
  location?: Place;
  directions?: string;
  approximate_area?: string;
  reschedule?: { id: number; starts_at: string } | null;
  review?: { rating: number; comment: string } | null;
  events?: { action: string; created_at: string }[];
  payment_enabled?: boolean;
  payment?: { id: string; status: string; amount: number } | null;
  max_fee: number;
  booking_mode: "choose" | "automatic";
};
export type Provider = {
  session_fee: number;
  pricing_tier: string;
  id: number;
  name: string;
  specialty: string;
  services: string[];
  distance_km: number;
  experience: string;
  availability: Mode;
};
const googleMap =
  Platform.OS === "web"
    ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY
    : Platform.OS === "android"
      ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_KEY
      : process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_KEY;
export const searchPlaces = (query: string) =>
  publicApiRequest<{ limited: boolean; results: Place[] }>(
    `locations/search/?q=${encodeURIComponent(query)}&map_provider=${googleMap ? "google" : "open"}`,
  );
export const getCoverage = () => apiRequest<Coverage>("provider/coverage/");
export const saveCoverage = (place: Place, radius: number, mode: Mode) =>
  apiRequest<Coverage>("provider/coverage/", {
    ...place,
    radius_km: radius,
    availability: mode,
  });
export const getCatalog = () =>
  apiRequest<{ specialties: Specialty[] }>("catalog/");
export const listBookings = () =>
  apiRequest<{ bookings: Booking[] }>("bookings/");
export const createBooking = (
  data: Place & {
    services: string[];
    starts_at?: string;
    directions?: string;
    preferred_provider_id?: number;
    expected_fee?: number;
    max_fee?: number;
  },
) => apiRequest<Booking>("bookings/", data);
export const discoverProviders = (
  data: Place & { services: string[]; starts_at?: string; max_fee?: number },
) => apiRequest<{ providers: Provider[] }>("providers/discover/", data);
export const cancelBooking = (id: string) =>
  apiRequest<Booking>(`bookings/${id}/cancel/`, {});
export const listOffers = () =>
  apiRequest<{
    offers: { id: number; expires_at: string; booking: Booking }[];
    appointments: Booking[];
  }>("provider/offers/");
export const respondOffer = (id: number, action: "accept" | "decline") =>
  apiRequest<Booking>(`provider/offers/${id}/${action}/`, {});

export type PatientNotification = {
  id: number;
  booking_id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};
export const listNotifications = () =>
  apiRequest<{ notifications: PatientNotification[]; unread_count: number }>(
    "notifications/",
  );
export const markNotificationsRead = (id?: number) =>
  apiRequest<{ unread_count: number }>(
    "notifications/read/",
    id ? { id } : { all: true },
  );
export const searchServices = (query: string) =>
  apiRequest<{ services: Specialty[] }>("services/search/", { query });
