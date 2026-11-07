import React, { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Search } from "lucide-react-native";
import { searchServices, Specialty } from "@/lib/marketplace/api";

export default function SymptomSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Specialty[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const version = useRef(0);
  const running = useRef(false);
  const search = async () => {
    if (running.current) return;
    if (query.trim().length < 2) {
      setError("Enter at least two characters to search.");
      return;
    }
    const requestVersion = version.current;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const data = await searchServices(query.trim());
      if (requestVersion === version.current) {
        setResults(data.services);
        setSearched(true);
      }
    } catch (err) {
      if (requestVersion === version.current)
        setError(
          err instanceof Error
            ? err.message
            : "Search is unavailable. Try again.",
        );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#D9DDE3",
          borderRadius: 14,
          paddingHorizontal: 12,
          backgroundColor: "white",
        }}
      >
        <Search size={18} color="#707588" />
        <TextInput
          accessibilityLabel="Search symptoms or services"
          placeholder="Search symptoms or services"
          value={query}
          maxLength={120}
          onChangeText={(text) => {
            version.current++;
            setQuery(text);
            setResults([]);
            setSearched(false);
            setError("");
          }}
          onSubmitEditing={() => void search()}
          returnKeyType="search"
          style={{
            flex: 1,
            minWidth: 0,
            padding: 14,
            fontSize: 16,
            color: "#0B2545",
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search services"
          disabled={busy}
          onPress={() => void search()}
          style={{ padding: 12 }}
        >
          <Text style={{ color: "#087F83", fontWeight: "700" }}>
            {busy ? "Searching…" : "Search"}
          </Text>
        </Pressable>
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: "#B91C1C" }}>
          {error}
        </Text>
      ) : null}
      {searched ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: "#0B2545", fontWeight: "700" }}
        >
          {results.length
            ? "Related care services"
            : "No matching service found. Try back pain, knee pain or sports injury."}
        </Text>
      ) : null}
      {results.map((service) => (
        <Pressable
          accessibilityRole="button"
          key={service.code}
          onPress={() =>
            router.push({
              pathname: "/patient/bookings",
              params: { mode: "automatic", service: service.code },
            })
          }
          style={{ padding: 16, borderRadius: 12, backgroundColor: "#E6F4F4" }}
        >
          <Text style={{ fontSize: 16, color: "#0B2545" }}>
            {service.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
