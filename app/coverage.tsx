import React, { useEffect, useState } from "react";
import { Redirect, router } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "@/lib/auth/context";
import { accountDestination } from "@/lib/auth/client";
import LocationPicker, {
  RadiusPicker,
} from "@/components/location/LocationPicker";
import {
  Button,
  Card,
  ErrorMessage,
  Page,
} from "@/components/marketplace/Primitives";
import { getCoverage, saveCoverage, Mode, Place } from "@/lib/marketplace/api";

export default function CoverageScreen() {
  const { user } = useAuth();
  const [place, setPlace] = useState<Place | null>(null);
  const [radius, setRadius] = useState(10);
  const [mode, setMode] = useState<Mode>("offline");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (user?.role !== "physiotherapist") {
      setLoading(false);
      return;
    }
    getCoverage()
      .then((data) => {
        if (data.latitude !== null && data.longitude !== null)
          setPlace({
            label: data.label,
            latitude: data.latitude,
            longitude: data.longitude,
          });
        setRadius(data.radius_km);
        setMode(data.availability);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.id, user?.role]);
  if (!user) return <Redirect href="/auth/login-physio" />;
  if (user.role !== "physiotherapist")
    return <Redirect href={accountDestination(user)} />;
  const save = async () => {
    if (!place) return;
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await saveCoverage(place, radius, mode);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save coverage.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page title="Where would you like to work?">
      <Text style={{ fontSize: 16, color: "#0B2545" }}>
        Choose a service-area center and how far you will travel. It can be
        different from your home or current location.
      </Text>
      <ErrorMessage message={error} />
      {loading ? (
        <Text>Loading your settings…</Text>
      ) : (
        <Card>
          <LocationPicker
            value={place}
            onChange={(value) => {
              setPlace(value);
              setSaved(false);
            }}
            radiusKm={radius}
          />
          <RadiusPicker
            value={radius}
            onChange={(value) => {
              setRadius(value);
              setSaved(false);
            }}
          />
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#0B2545" }}>
            Availability
          </Text>
          {(
            [
              ["available_now", "Available now"],
              ["scheduled_only", "Scheduled appointments only"],
              ["offline", "Offline"],
            ] as [Mode, string][]
          ).map(([value, label]) => (
            <Button
              key={value}
              title={`${mode === value ? "✓ " : ""}${label}`}
              secondary={mode !== value}
              disabled={
                busy ||
                (value !== "offline" && user.verification_status !== "approved")
              }
              onPress={() => {
                setMode(value);
                setSaved(false);
              }}
            />
          ))}
          <Text style={{ color: "#707588" }}>
            Scheduled-only opts you in to future requests. Sessions reserve 60
            minutes. Recurring working hours and travel buffers are not
            configured yet.
          </Text>
          {user.verification_status !== "approved" ? (
            <Text>
              Your coverage can be saved now, but receiving requests requires
              professional approval.
            </Text>
          ) : null}
          <Button
            title={busy ? "Saving…" : "Confirm service area and availability"}
            disabled={!place || busy}
            onPress={() => void save()}
          />
          {saved ? (
            <Text accessibilityRole="alert" style={{ color: "#087F83" }}>
              Your service area and availability have been saved.
            </Text>
          ) : null}
        </Card>
      )}
      <Button
        secondary
        title="Back"
        onPress={() => router.replace(accountDestination(user))}
      />
    </Page>
  );
}
