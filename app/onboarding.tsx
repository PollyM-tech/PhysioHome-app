import React from "react";
import { Link } from "expo-router";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ImageBackground,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  ShieldCheck,
  House,
  CalendarDays,
  ArrowRight,
} from "lucide-react-native";

import { Logo } from "../components/common/Logo";
import { colors } from "../constants/colors";

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.phoneWrapper}>
          {/* ── HERO ── */}
          <ImageBackground
            source={require("../assets/images/hero.png")}
            resizeMode="cover"
            style={styles.hero}
            imageStyle={styles.heroImage}
          >
            <View style={styles.heroOverlay}>
              {/* Skip */}
              <View style={styles.skipRow}>
                <Pressable>
                  <Text style={styles.skipText}>Skip</Text>
                </Pressable>
              </View>

              {/* Logo */}
              <View style={styles.logoWrap}>
                <Logo width={180} height={80} />
              </View>

              {/* Headline */}
              <View style={styles.headlineWrap}>
                <Text style={styles.headlineNavy}>
                  Professional{"\n"}Physiotherapy{"\n"}
                  <Text style={styles.headlineTeal}>at Home</Text>
                </Text>
                <Text style={styles.subtitle}>
                  Book trusted physiotherapists{"\n"}
                  to help you heal, recover and{"\n"}
                  live pain-free.
                </Text>
              </View>
            </View>
          </ImageBackground>

          {/* ── BOTTOM CARD ── */}
          <View style={styles.card}>
            {/* Feature row */}
            <View style={styles.featureRow}>
              <FeatureItem
                icon={<ShieldCheck size={28} color={colors.primaryTeal} />}
                label={"Verified\nExperts"}
              />
              <View style={styles.divider} />
              <FeatureItem
                icon={<House size={28} color={colors.primaryTeal} />}
                label={"Care at\nHome"}
              />
              <View style={styles.divider} />
              <FeatureItem
                icon={<CalendarDays size={28} color={colors.primaryTeal} />}
                label={"Easy\nBooking"}
              />
            </View>

            <Link href="/auth/choose-role" asChild>
              <Pressable style={styles.ctaButton}>
                <View style={{ width: 26 }} />
                <Text style={styles.ctaText}>Get Started</Text>
                <ArrowRight size={26} color="#fff" />
              </Pressable>
            </Link>

            {/* Login row */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Link href="/auth/login-patient" asChild>
                <Pressable>
                  <Text style={styles.loginLink}>Log in</Text>
                </Pressable>
              </Link>
            </View>

            {/* Dots */}
            <View style={styles.dotsRow}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>

            {/* iPhone home indicator */}
            <View style={styles.homeIndicatorWrap}>
              <View style={styles.homeIndicator} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type FeatureItemProps = {
  icon: React.ReactNode;
  label: string;
};

function FeatureItem({ icon, label }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },

  phoneWrapper: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#F6ECDD",
    overflow: "hidden",
  },

  // ── Hero ──
  hero: {
    width: "100%",
    height: 560,
  },
  heroImage: {
    top: -30,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: "rgba(246,236,221,0.28)",
    paddingHorizontal: 24,
    paddingTop: 16,
  },

  skipRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  skipText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#138A8A",
  },

  logoWrap: {
    alignItems: "center",
    marginTop: 10,
  },

  headlineWrap: {
    alignItems: "center",
    marginTop: 14,
  },
  headlineNavy: {
    textAlign: "center",
    fontSize: 38,
    fontWeight: "900",
    lineHeight: 46,
    color: "#0B2545",
  },
  headlineTeal: {
    color: "#138A8A",
  },
  subtitle: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 27,
    color: "rgba(11,37,69,0.82)",
  },

  // ── Card ──
  card: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 16,
    marginTop: -2,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  featureItem: {
    flex: 1,
    alignItems: "center",
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#E6F4F4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  featureLabel: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    color: "#0B2545",
  },
  divider: {
    width: 1,
    height: 76,
    backgroundColor: "#E8E8E8",
    marginTop: 6,
  },

  // ── CTA ──
  ctaButton: {
    height: 62,
    borderRadius: 22,
    backgroundColor: "#138A8A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  ctaText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },

  // ── Login ──
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  loginText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#707588",
  },
  loginLink: {
    fontSize: 16,
    fontWeight: "800",
    color: "#138A8A",
  },

  // ── Dots ──
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D5D9DE",
  },
  dotActive: {
    backgroundColor: "#138A8A",
  },

  // ── Home indicator ──
  homeIndicatorWrap: {
    alignItems: "center",
    paddingBottom: 8,
  },
  homeIndicator: {
    width: 130,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#0B2545",
  },
});
