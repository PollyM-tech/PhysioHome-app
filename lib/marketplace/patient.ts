import { apiRequest, Account } from "@/lib/auth/client";
import { Booking, Place } from "./api";

export type PatientDetails = {
  date_of_birth: string | null;
  gender: string;
  mobility_needs: string;
  communication: string;
  care_notes: string;
  emergency_name: string;
  emergency_relationship: string;
  emergency_phone: string;
  push_enabled: boolean;
};
export type Profile = {
  account: Account;
  profile: PatientDetails;
  counts: { active: number; completed: number; locations: number };
};
export const getProfile = () => apiRequest<Profile>("patient/profile/");
export const saveProfile = (
  data: Omit<PatientDetails, "push_enabled"> & {
    full_name: string;
    email: string;
    phone: string;
    current_password?: string;
  },
) => apiRequest<Profile>("patient/profile/", data);
export type SavedPlace = Place & { id: number };
export const getSavedPlaces = () =>
  apiRequest<{ locations: SavedPlace[] }>("patient/locations/");
export const savePlace = (place: Place & { id?: number; delete?: boolean }) =>
  apiRequest<{ locations: SavedPlace[] }>("patient/locations/", place);
export const requestReschedule = (id: string, starts_at: string) =>
  apiRequest<Booking>(`bookings/${id}/reschedule/`, { starts_at });
export const respondReschedule = (id: string, action: "accept" | "decline") =>
  apiRequest<Booking>(`bookings/${id}/reschedule/${action}/`, {});
export const progressBooking = (id: string, action: string) =>
  apiRequest<Booking>(`bookings/${id}/progress/${action}/`, {});
export const reviewBooking = (id: string, rating: number, comment: string) =>
  apiRequest<Booking>(`bookings/${id}/review/`, { rating, comment });
export type Ticket = {
  id: number;
  subject: string;
  body: string;
  status: string;
  created_at: string;
};
export const getTickets = () =>
  apiRequest<{ tickets: Ticket[] }>("patient/support/");
export const createTicket = (subject: string, body: string) =>
  apiRequest<{ tickets: Ticket[] }>("patient/support/", { subject, body });
export const changePassword = (
  current_password: string,
  new_password: string,
) =>
  apiRequest<{ detail: string }>("patient/password/", {
    current_password,
    new_password,
  });
export const setPush = (enabled: boolean, token?: string) =>
  apiRequest<{ enabled: boolean }>("patient/push/", {
    enabled,
    ...(token ? { token } : {}),
  });
