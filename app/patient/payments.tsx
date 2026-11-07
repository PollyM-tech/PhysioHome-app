import React, { useCallback, useState } from "react";
import { Text } from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  Page,
  Card,
  Button,
  ErrorMessage,
} from "@/components/marketplace/Primitives";
import { getPayments, Payment } from "@/lib/marketplace/payments";
export default function PaymentsScreen() {
  const [enabled, setEnabled] = useState(false),
    [payments, setPayments] = useState<Payment[]>([]),
    [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getPayments()
        .then((data) => {
          if (active) {
            setEnabled(data.enabled);
            setPayments(data.payments);
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
      return () => {
        active = false;
      };
    }, []),
  );
  return (
    <Page backTo="/patient/settings" title="Payments">
      <ErrorMessage message={error} />
      <Card>
        <Text>
          Pricing is per 60-minute session, with travel included within your
          physiotherapist’s service area.
        </Text>
        <Text>1 to under 3 years: KES 2,000</Text>
        <Text>3 to under 5 years: KES 3,000</Text>
        <Text>5+ years: KES 3,500</Text>
        <Text>
          Approved consultants: one fixed rate from KES 3,500 to 4,500.
        </Text>
        <Text>
          Choose a maximum budget before matching. Your assigned
          physiotherapist’s agreed total appears in Bookings.
        </Text>
        <Text>
          {enabled
            ? "Pay from your accepted appointment in Bookings. Enter your M-Pesa PIN only in the phone payment prompt."
            : "M-Pesa checkout is not configured yet. No payment request can be sent."}
        </Text>
        <Button
          secondary
          title="Open Bookings"
          onPress={() => router.push("/patient/bookings")}
        />
      </Card>
      {payments.length ? (
        <Text style={{ fontWeight: "700", fontSize: 20 }}>Payment history</Text>
      ) : (
        <Text>No payment attempts yet.</Text>
      )}
      {payments.map((payment) => (
        <Card key={payment.id}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>
            KES {payment.amount.toLocaleString()}
          </Text>
          <Text>{payment.status.replaceAll("_", " ")}</Text>
          <Text>{new Date(payment.created_at).toLocaleString()}</Text>
          <Text>Payment reference: {payment.id}</Text>
          {payment.status === "refund_required" ? (
            <Text>
              A refund requires administrator action. No automatic refund has
              been made.
            </Text>
          ) : null}
        </Card>
      ))}
    </Page>
  );
}
