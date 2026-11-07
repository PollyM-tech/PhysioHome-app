import React, { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import { AppState, Text } from "react-native";
import { useAuth } from "@/lib/auth/context";
import {
  Button,
  Card,
  ErrorMessage,
  Page,
} from "@/components/marketplace/Primitives";
import { Coverage, getCoverage, listOffers } from "@/lib/marketplace/api";

export default function PhysioHomeScreen() {
  const { user } = useAuth();
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [count, setCount] = useState(0);
  const [appointments, setAppointments] = useState(0);
  const [error, setError] = useState("");
  useFocusEffect(
    useCallback(() => {
      let active = true;
      let running = false;
      const load = () => {
        if (
          running ||
          AppState.currentState === "background" ||
          AppState.currentState === "inactive"
        )
          return;
        running = true;
        void Promise.all([getCoverage(), listOffers()])
          .then(([area, requests]) => {
            if (active) {
              setCoverage(area);
              setCount(requests.offers.length);
              setAppointments(requests.appointments.length);
              setError("");
            }
          })
          .catch((err) => {
            if (active) setError(err.message);
          })
          .finally(() => {
            running = false;
          });
      };
      load();
      const timer = setInterval(load, 10000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, []),
  );
  return (
    <Page title={`Welcome, ${user?.full_name ?? ""}`}>
      <ErrorMessage message={error} />
      <Text>
        {coverage?.session_fee
          ? `Your reviewed session rate: KES ${coverage.session_fee.toLocaleString()} · travel included`
          : "Your pricing tier needs an administrator review before you can receive new requests."}
      </Text>
      <Card>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#0B2545" }}>
          Your service coverage
        </Text>
        <Text style={{ fontSize: 16 }}>
          {coverage?.confirmed
            ? `${coverage.label} · ${coverage.radius_km} km travel radius`
            : "Confirm a location on the map before receiving requests."}
        </Text>
        <Text>
          Availability:{" "}
          {coverage?.availability === "available_now"
            ? "Available now"
            : coverage?.availability === "scheduled_only"
              ? "Scheduled appointments only"
              : "Offline"}
        </Text>
        <Button
          title="Manage service area and availability"
          onPress={() => router.push("/coverage")}
        />
      </Card>
      <Card>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#0B2545" }}>
          Requests and appointments
        </Text>
        <Text>
          {count} incoming offers · {appointments} accepted appointments
          awaiting payment setup
        </Text>
        <Button
          title={
            count
              ? `View ${count} matching request${count === 1 ? "" : "s"}`
              : "View matching requests"
          }
          onPress={() => router.push("/physiotherapist/requests")}
        />
      </Card>
      <Text style={{ color: "#707588" }}>
        Requests match your approved specialty, chosen coverage and
        availability. Offers expire if no response is received. Live push alerts
        and payment collection are not enabled yet.
      </Text>
    </Page>
  );
}
