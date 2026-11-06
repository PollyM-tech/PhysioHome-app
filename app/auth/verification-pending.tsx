import React, { useState } from "react";
import { SafeAreaView, View, Text, Pressable, StyleSheet } from "react-native";
import { ShieldCheck } from "lucide-react-native";
import { useAuth } from "@/lib/auth/context";

export default function VerificationPendingScreen() {
  const { user, refreshUser, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const status = user?.verification_status ?? "pending";
  const check = async (logout = false) => {
    setBusy(true);
    setError("");
    try {
      if (logout) await signOut();
      else await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.card}>
        <ShieldCheck size={52} color="#138A8A" />
        <Text style={s.title}>
          {status === "pending"
            ? "Your account is pending review"
            : `Verification ${status}`}
        </Text>
        <Text style={s.body}>
          Hello {user?.full_name}. Your professional details have been saved.
          Access to appointments and earnings requires approval of your
          professional credentials.
        </Text>
        <Text style={s.body}>
          You can check your current status below. Registration does not verify
          your license or phone number.
        </Text>
        {error ? (
          <Text accessibilityRole="alert" style={{ color: "#B91C1C" }}>
            {error}
          </Text>
        ) : null}
        <Pressable
          disabled={busy}
          onPress={() => void check()}
          style={s.button}
        >
          <Text style={s.label}>
            {busy ? "Please wait…" : "Check verification status"}
          </Text>
        </Pressable>
        <Pressable
          disabled={busy}
          onPress={() => void check(true)}
          style={{ padding: 16 }}
        >
          <Text style={{ color: "#087F83" }}>Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#E6F4F4",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    maxWidth: 480,
    alignSelf: "center",
    backgroundColor: "white",
    padding: 24,
    borderRadius: 22,
    gap: 20,
    width: "100%",
  },
  title: { color: "#0B2545", fontSize: 28, fontWeight: "700" },
  body: { color: "#0B2545", fontSize: 16, lineHeight: 24 },
  button: {
    backgroundColor: "#087F83",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
  },
  label: { color: "white", fontWeight: "700", fontSize: 16 },
});
