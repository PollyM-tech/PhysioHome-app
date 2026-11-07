import React, { useCallback, useRef, useState } from "react";
import { AppState, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import * as Crypto from "expo-crypto";
import { useAuth } from "@/lib/auth/context";
import { Booking } from "@/lib/marketplace/api";
import { getPayment, payBooking } from "@/lib/marketplace/payments";
import Field from "@/components/forms/Field";
import { Button, ErrorMessage } from "@/components/marketplace/Primitives";
export default function PaymentControls({
  booking,
  onChanged,
}: {
  booking: Booking;
  onChanged: () => Promise<void>;
}) {
  const { user } = useAuth();
  const enabled = !!booking.payment_enabled;
  const [phone, setPhone] = useState(user?.phone || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [localPayment, setLocalPayment] = useState<NonNullable<
      Booking["payment"]
    > | null>(null);
  const key = useRef<string | null>(null);
  const status =
    booking.payment?.id === localPayment?.id
      ? booking.payment?.status
      : localPayment?.status || booking.payment?.status;
  const changed = useRef(onChanged);
  changed.current = onChanged;
  const paymentId = localPayment?.id || booking.payment?.id,
    paymentState = status;
  useFocusEffect(
    useCallback(() => {
      let active = true,
        running = false;
      const poll = async () => {
        if (
          running ||
          !paymentId ||
          !["initiating", "pending", "unknown"].includes(paymentState || "") ||
          AppState.currentState === "background" ||
          AppState.currentState === "inactive"
        )
          return;
        running = true;
        try {
          await getPayment(paymentId);
          if (active) await changed.current();
        } catch (e) {
          if (active)
            setError(
              e instanceof Error ? e.message : "Unable to check payment.",
            );
        } finally {
          running = false;
        }
      };
      const timer = setInterval(() => void poll(), 15000);
      return () => {
        active = false;
        clearInterval(timer);
      };
      // The booking list independently refreshes authoritative status; avoid resetting this timer on every render.
    }, [paymentId, paymentState]),
  );
  const send = async () => {
    setBusy(true);
    setError("");
    try {
      key.current ||= Crypto.randomUUID();
      const payment = await payBooking(
        booking.id,
        key.current,
        phone,
        Number(booking.quoted_fee),
      );
      setLocalPayment(payment);
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to request payment.");
    } finally {
      setBusy(false);
    }
  };
  const labels: Record<string, string> = {
    initiating: "Preparing the payment request. Do not submit another payment.",
    pending:
      "Check your phone for the M-Pesa prompt. Enter your PIN only in the M-Pesa prompt. Payment is not confirmed yet.",
    unknown:
      "Payment needs reconciliation. Do not pay again; contact support so the existing attempt can be checked.",
    succeeded: "Your payment has been verified.",
    failed: "The previous payment was unsuccessful. You can try again.",
    refund_required:
      "This payment needs an administrator refund review. No automatic refund has been made.",
  };
  return (
    <View style={{ gap: 12 }}>
      <ErrorMessage message={error} />
      {status ? <Text>{labels[status] || status}</Text> : null}
      {booking.status === "payment_pending" &&
      booking.quoted_fee &&
      (!status || status === "failed") ? (
        <>
          {enabled ? (
            <>
              <Text>
                Total: KES {Number(booking.quoted_fee).toLocaleString()} for
                PhysioHome. Travel is included.
              </Text>
              <Field
                label="M-Pesa mobile number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={20}
              />
              <Button
                title={
                  busy
                    ? "Requesting payment…"
                    : `Pay KES ${Number(booking.quoted_fee).toLocaleString()} with M-Pesa`
                }
                disabled={busy || !phone.trim()}
                onPress={() => {
                  if (status === "failed") key.current = null;
                  void send();
                }}
              />
            </>
          ) : (
            <Text>
              M-Pesa checkout is not configured yet. No payment request can be
              sent.
            </Text>
          )}
        </>
      ) : null}
    </View>
  );
}
