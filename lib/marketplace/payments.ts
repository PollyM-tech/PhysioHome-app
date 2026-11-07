import { apiRequest } from "@/lib/auth/client";
export type Payment = {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};
export const getPayments = () =>
  apiRequest<{ enabled: boolean; merchant: string; payments: Payment[] }>(
    "payments/mpesa/",
  );
export const payBooking = (
  booking: string,
  client_id: string,
  phone: string,
  expected_amount: number,
) =>
  apiRequest<Payment>(`bookings/${booking}/pay/`, {
    client_id,
    phone,
    expected_amount,
  });
export const getPayment = (id: string) =>
  apiRequest<Payment>(`payments/mpesa/${id}/`);
