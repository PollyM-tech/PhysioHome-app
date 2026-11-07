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
import { ArrowUpRight, ChevronRight } from "lucide-react-native";
import CareOverview from "@/components/home/CareOverview";
import { Logo } from "@/components/common/Logo";
import { useAuth } from "@/lib/auth/context";

export default function OnboardingScreen() {
  const { width } = useWindowDimensions(),
    { user } = useAuth();
  const wide = width >= 900;
  const begin = (mode: "automatic" | "choose") =>
    router.push(
      user?.role === "patient"
        ? { pathname: "/patient/bookings", params: { mode, service: "" } }
        : { pathname: "/auth/signup-patient", params: { intent: mode } },
    );
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.shell, wide && s.shellWide]}>
          <View style={s.header}>
            <View style={s.brand}>
              <Logo width={38} height={38} />
              <Text style={s.wordmark}>
                Physio<Text style={{ color: "#087F83" }}>Home</Text>
              </Text>
            </View>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push("/auth/login-patient")}
              style={s.login}
            >
              <Text style={s.loginText}>Log in</Text>
              <ChevronRight color="#0B2545" size={16} />
            </Pressable>
          </View>
          <View style={[s.hero, wide && s.heroWide]}>
            <CareOverview
              onFind={() => begin("automatic")}
              onChoose={() => begin("choose")}
            />
          </View>
          <View style={s.footer}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.footerTitle}>Are you a physiotherapist?</Text>
              <Text style={s.footerText}>
                Set your service area and receive matching requests.
              </Text>
            </View>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push("/auth/signup-physio")}
              style={s.join}
            >
              <Text style={s.joinText}>Join us</Text>
              <ArrowUpRight color="#087F83" size={17} />
            </Pressable>
          </View>
          <Text style={s.coverage}>
            Matching depends on provider coverage and availability in your area.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F6F0" },
  scroll: { flexGrow: 1, alignItems: "center" },
  shell: { width: "100%", maxWidth: 1200, paddingHorizontal: 22 },
  shellWide: { paddingHorizontal: 44 },
  header: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E7DF",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 4 },
  wordmark: {
    fontWeight: "800",
    fontSize: 21,
    letterSpacing: -0.7,
    color: "#0B2545",
  },
  login: {
    paddingVertical: 12,
    paddingLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
  },
  loginText: { fontSize: 14, fontWeight: "700", color: "#0B2545" },
  hero: { paddingTop: 26, paddingBottom: 22 },
  heroWide: { paddingTop: 40, paddingBottom: 36 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#DCE6E2",
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  footerTitle: { fontSize: 13, fontWeight: "700", color: "#0B2545" },
  footerText: { fontSize: 12, lineHeight: 18, color: "#647580" },
  join: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    minHeight: 44,
    paddingLeft: 6,
  },
  joinText: { fontSize: 14, fontWeight: "700", color: "#087F83" },
  coverage: {
    fontSize: 11,
    lineHeight: 17,
    color: "#647580",
    paddingBottom: 24,
  },
});
