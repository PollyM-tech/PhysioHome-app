import React from "react";
import { Link } from "expo-router";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
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
      <View style={styles.container}>
        {/* Top Section */}
        <View style={styles.topRow}>
          <View />
          <Pressable>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Logo */}
        <View style={styles.logoWrapper}>
          <Logo width={180} height={70} />
        </View>

        {/* Heading */}
        <View style={styles.textSection}>
          <Text style={styles.heading}>
            Professional Physiotherapy{" "}
            <Text style={styles.headingAccent}>at Home</Text>
          </Text>

          <Text style={styles.subText}>
            Book trusted physiotherapists to help you heal, recover and live
            pain-free.
          </Text>
        </View>

        {/* Hero Image */}
        <View style={styles.imageWrapper}>
          <Image
            source={require("../assets/images/hero.png")}
            style={styles.heroImage}
          />
        </View>

        {/* Bottom Card */}
        <View style={styles.bottomCard}>
          <View style={styles.featuresRow}>
            <FeatureItem
              icon={<ShieldCheck size={28} color={colors.primaryTeal} />}
              label="Verified Experts"
            />
            <FeatureItem
              icon={<House size={28} color={colors.primaryTeal} />}
              label="Care at Home"
            />
            <FeatureItem
              icon={<CalendarDays size={28} color={colors.primaryTeal} />}
              label="Easy Booking"
            />
          </View>

          <Link href="/auth/signup" asChild>
            <Pressable style={styles.ctaButton}>
              <Text style={styles.ctaText}>Get Started</Text>
              <ArrowRight size={24} color={colors.white} />
            </Pressable>
          </Link>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Link href="/auth/login" asChild>
              <Pressable>
                <Text style={styles.loginLink}>Log in</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.dotsRow}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </View>
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
    backgroundColor: colors.softCream,
  },
  container: {
    flex: 1,
    backgroundColor: colors.softCream,
  },
  topRow: {
    paddingHorizontal: 24,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipText: {
    color: colors.primaryTeal,
    fontSize: 16,
    fontWeight: "700",
  },
  logoWrapper: {
    alignItems: "center",
    marginTop: 10,
  },
  textSection: {
    paddingHorizontal: 28,
    marginTop: 10,
    alignItems: "center",
  },
  heading: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: colors.primaryNavy,
    textAlign: "center",
  },
  headingAccent: {
    color: colors.primaryTeal,
  },
  subText: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500",
    color: colors.primaryNavy,
    textAlign: "center",
    opacity: 0.85,
    maxWidth: 320,
  },
  imageWrapper: {
    marginTop: 22,
    paddingHorizontal: 18,
  },
  heroImage: {
    width: "100%",
    height: 320,
    borderRadius: 22,
    resizeMode: "cover",
  },
  bottomCard: {
    flex: 1,
    backgroundColor: colors.white,
    marginTop: 18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  featuresRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  featureItem: {
    flex: 1,
    alignItems: "center",
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.lightTealTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  featureLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.primaryNavy,
    textAlign: "center",
  },
  ctaButton: {
    marginTop: 30,
    height: 58,
    borderRadius: 22,
    backgroundColor: colors.primaryTeal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
  },
  ctaText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "800",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  loginText: {
    fontSize: 15,
    color: colors.mutedSlate,
    fontWeight: "500",
  },
  loginLink: {
    fontSize: 15,
    color: colors.primaryTeal,
    fontWeight: "700",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 22,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.lightGray,
  },
  activeDot: {
    width: 12,
    height: 12,
    backgroundColor: colors.primaryTeal,
  },
});
