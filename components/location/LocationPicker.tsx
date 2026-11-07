import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";
import { Place, searchPlaces } from "@/lib/marketplace/api";
import PinMap from "./PinMap";

export default function LocationPicker({
  value,
  onChange,
  radiusKm,
  allowSearch = true,
}: {
  value: Place | null;
  onChange: (value: Place | null) => void;
  radiusKm?: number;
  allowSearch?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [limited, setLimited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const search = async () => {
    if (busy || query.trim().length < 2) return;
    setBusy(true);
    setError("");
    try {
      const data = await searchPlaces(query.trim());
      setResults(data.results);
      setLimited(data.limited);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Search unavailable. Try a map pin.",
      );
    } finally {
      setBusy(false);
    }
  };
  const current = async () => {
    setBusy(true);
    setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted")
        throw new Error(
          "Location permission was not granted. Tap the map to choose your location instead.",
        );
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const position = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          new Promise<never>((_, reject) => {
            timer = setTimeout(
              () =>
                reject(
                  new Error(
                    "Location timed out. Choose a map pin or try again.",
                  ),
                ),
              12000,
            );
          }),
        ]);
        onChange({
          label: "Current location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } finally {
        if (timer) clearTimeout(timer);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to obtain location.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 12 }}>
      {allowSearch ? (
        <TextInput
          accessibilityLabel={
            radiusKm ? "Search service area" : "Search visit location"
          }
          placeholder="Search a town or area"
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setResults([]);
          }}
          onSubmitEditing={() => void search()}
          style={{
            borderWidth: 1,
            borderColor: "#D9DDE3",
            borderRadius: 12,
            padding: 14,
            fontSize: 16,
          }}
        />
      ) : null}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {allowSearch ? (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void search()}
            style={{ padding: 12 }}
          >
            <Text style={{ color: "#087F83" }}>
              {busy ? "Please wait…" : "Search area"}
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void current()}
          style={{ padding: 12 }}
        >
          <Text style={{ color: "#087F83" }}>Use my current location</Text>
        </Pressable>
      </View>
      {limited ? (
        <Text style={{ color: "#707588" }}>
          Showing supported Kenyan area centers. Adjust the pin for your chosen
          location, or tap the map to select another area.
        </Text>
      ) : null}
      {results.map((place, i) => (
        <Pressable
          accessibilityRole="button"
          key={i}
          onPress={() => {
            onChange(place);
            setResults([]);
          }}
          style={{ padding: 14, backgroundColor: "#E6F4F4", borderRadius: 12 }}
        >
          <Text>{place.label}</Text>
        </Pressable>
      ))}
      {limited && !results.length ? (
        <Text style={{ color: "#707588" }}>
          You can also tap the map to choose any location.
        </Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={{ color: "#B91C1C" }}>
          {error}
        </Text>
      ) : null}
      <PinMap value={value} radiusKm={radiusKm} onChange={onChange} />
      <Text style={{ color: "#0B2545" }}>
        {value
          ? `${value.label} · ${value.latitude.toFixed(4)}, ${value.longitude.toFixed(4)}`
          : "Tap the map or use your current location to confirm a pin."}
      </Text>
      <Text style={{ color: "#707588" }}>
        Confirm this pin before continuing. It will stay fixed until you choose
        a different location.
      </Text>
    </View>
  );
}

export function RadiusPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: "#0B2545", fontWeight: "700", fontSize: 16 }}>
        Travel radius
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {[5, 10, 15].map((radius) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: radius === value }}
            key={radius}
            onPress={() => onChange(radius)}
            style={{
              padding: 14,
              borderRadius: 12,
              backgroundColor: radius === value ? "#138A8A" : "#E6F4F4",
            }}
          >
            <Text style={{ color: radius === value ? "white" : "#0B2545" }}>
              {radius} km
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
