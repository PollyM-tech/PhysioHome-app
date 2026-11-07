import React from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import { Menu, ArrowRight } from "lucide-react-native";
import CareOverview from "@/components/home/CareOverview";
import NotificationBell from "@/components/patient/NotificationBell";
import SymptomSearch from "@/components/patient/SymptomSearch";
import { useAuth } from "@/lib/auth/context";
const SERVICES = [
  ["Back & neck pain", "spine"],
  ["Knee & joint care", "knee"],
  ["Sports injury", "sports"],
  ["Stroke rehabilitation", "neurological"],
  ["After surgery", "post_surgery"],
  ["General physiotherapy", "general"],
];
export default function PatientHomeScreen() {
  const { user } = useAuth(),
    { width } = useWindowDimensions();
  const wide = width >= 900;
  const book = (mode: "automatic" | "choose", service = "") =>
    router.push({ pathname: "/patient/bookings", params: { mode, service } });
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[s.shell, wide && s.shellWide]}>
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open patient menu"
                onPress={() => router.push("/patient/settings")}
                style={s.icon}
              >
                <Menu size={24} color="#0B2545" />
              </Pressable>
              <Text style={s.wordmark}>
                Physio<Text style={{ color: "#087F83" }}>Home</Text>
              </Text>
            </View>
            <View style={s.headerLeft}>
              <NotificationBell />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open my profile"
                onPress={() => router.push("/patient/profile")}
                style={s.avatar}
              >
                <Text style={s.initial}>
                  {user?.full_name?.trim().charAt(0).toUpperCase() || "P"}
                </Text>
              </Pressable>
            </View>
          </View>
          <View style={s.intro}>
            <Text style={s.greeting}>
              Hello
              {user?.full_name?.trim()
                ? ", " + user.full_name.trim().split(" ")[0]
                : ""}
              . Let’s find your care.
            </Text>
            <CareOverview
              returning
              onFind={() => book("automatic")}
              onChoose={() => book("choose")}
            />
          </View>
          <View style={s.section}>
            <Text accessibilityRole="header" style={s.sectionTitle}>
              Not sure which care to choose?
            </Text>
            <Text style={s.body}>
              Search for a symptom or pick a care area to get started.
            </Text>
            <SymptomSearch />
            <View style={s.services}>
              {SERVICES.map(([label, code]) => (
                <Pressable
                  key={code}
                  accessibilityRole="button"
                  onPress={() => book("automatic", code)}
                  style={({ pressed }) => [
                    s.service,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text style={s.serviceText}>{label}</Text>
                  <ArrowRight size={15} color="#087F83" />
                </Pressable>
              ))}
            </View>
          </View>
          <View style={s.bottom}>
            <Text style={s.body}>Already requested a visit?</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/patient/bookings")}
              style={s.bookingLink}
            >
              <Text style={s.linkText}>View your bookings</Text>
              <ArrowRight size={17} color="#087F83" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F6F0" },
  scroll: { alignItems: "center", paddingBottom: 28 },
  shell: { width: "100%", maxWidth: 1200, paddingHorizontal: 20 },
  shellWide: { paddingHorizontal: 44 },
  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E7DF",
    gap: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { padding: 10, marginLeft: -10, minHeight: 44, minWidth: 44 },
  wordmark: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: "#0B2545",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCEDE8",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 15, fontWeight: "800", color: "#087F83" },
  intro: { paddingTop: 18, gap: 20, paddingBottom: 28 },
  greeting: { fontSize: 13, color: "#536775" },
  section: {
    borderTopWidth: 1,
    borderTopColor: "#DCE6E2",
    paddingVertical: 24,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#0B2545",
  },
  body: { fontSize: 14, lineHeight: 21, color: "#536775" },
  services: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  service: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#DCE6E2",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    minHeight: 46,
  },
  serviceText: { fontSize: 13, fontWeight: "600", color: "#0B2545" },
  bottom: {
    borderTopWidth: 1,
    borderTopColor: "#DCE6E2",
    paddingVertical: 18,
    gap: 10,
  },
  bookingLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
  },
  linkText: { fontWeight: "700", fontSize: 15, color: "#087F83" },
});
