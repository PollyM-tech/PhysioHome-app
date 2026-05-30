import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Link } from "expo-router";
import {
  User,
  UserPlus,
  ChevronRight,
  ShieldCheck,
  House,
  Lock,
  Clock,
} from "lucide-react-native";

import { Logo } from "../../components/common/Logo";

// ─── Trust Items ──────────────────────────────────────────────────
const TRUST_ITEMS = [
  {
    icon: <ShieldCheck size={24} color="#138A8A" />,
    label: "Verified\nProfessionals",
    sub: "Licensed & trusted\nexperts",
  },
  {
    icon: <House size={24} color="#138A8A" />,
    label: "At-Home\nCare",
    sub: "Comfort of your\nhome",
  },
  {
    icon: <Lock size={24} color="#138A8A" />,
    label: "Secure\nPayments",
    sub: "Safe & protected\ntransactions",
  },
  {
    icon: <Clock size={24} color="#138A8A" />,
    label: "Quick\nBooking",
    sub: "Book in minutes,\nget care fast",
  },
];

// ─── Main Screen ──────────────────────────────────────────────────
export default function ChooseRoleScreen() {
  const [selected, setSelected] = useState<"patient" | "physio" | null>(null);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={s.phone}>
          {/* ── Logo ── */}
          <View style={s.logoSection}>
            <Logo width={120} height={120} />
            <Text style={s.logoTitle}>
              <Text style={s.logoNavy}>Physio</Text>
              <Text style={s.logoTeal}>Home</Text>
            </Text>
            <Text style={s.logoTagline}>Care at Your Doorstep</Text>
          </View>

          {/* ── Heading ── */}
          <View style={s.headingSection}>
            <Text style={s.heading}>
              {"How would you like\nto use PhysioHome?"}
            </Text>
            <Text style={s.subheading}>
              {"Choose the account type that\nbest describes you."}
            </Text>
          </View>

          {/* ── Role Cards ── */}
          <View style={s.cardsSection}>
            {/* Patient Card */}
            <Pressable
              style={[
                s.roleCard,
                s.patientCard,
                selected === "patient" && s.roleCardSelected,
                selected === "patient" && s.patientCardSelected,
              ]}
              onPress={() => setSelected("patient")}
            >
              {/* Icon circle */}
              <View style={[s.roleIconWrap, s.patientIconWrap]}>
                <User size={38} color="#138A8A" strokeWidth={1.5} />
              </View>

              {/* Text */}
              <View style={s.roleTextWrap}>
                <Text style={s.roleTitle}>I am a Patient</Text>
                <Text style={s.roleDesc}>
                  {
                    "Book trusted physiotherapists\nfor home-based treatment\nand recovery."
                  }
                </Text>
              </View>

              {/* Arrow */}
              <ChevronRight size={22} color="#138A8A" />
            </Pressable>

            {/* Physiotherapist Card */}
            <Pressable
              style={[
                s.roleCard,
                s.physioCard,
                selected === "physio" && s.roleCardSelected,
                selected === "physio" && s.physioCardSelected,
              ]}
              onPress={() => setSelected("physio")}
            >
              {/* Icon circle */}
              <View style={[s.roleIconWrap, s.physioIconWrap]}>
                <UserPlus size={38} color="#138A8A" strokeWidth={1.5} />
              </View>

              {/* Text */}
              <View style={s.roleTextWrap}>
                <Text style={s.roleTitle}>I am a Physiotherapist</Text>
                <Text style={s.roleDesc}>
                  {
                    "Join PhysioHome to receive\nbookings, manage sessions,\nand serve patients at home."
                  }
                </Text>
              </View>

              {/* Arrow */}
              <ChevronRight size={22} color="#138A8A" />
            </Pressable>
          </View>

          {/* ── Continue Button (shows when selected) ── */}
          {selected && (
            <Link
              href={
                selected === "patient"
                  ? "/auth/signup-patient"
                  : "/auth/signup-physio"
              }
              asChild
            >
              <Pressable style={s.continueBtn}>
                <Text style={s.continueBtnText}>
                  Continue as{" "}
                  {selected === "patient" ? "Patient" : "Physiotherapist"}
                </Text>
                <ChevronRight size={20} color="#fff" />
              </Pressable>
            </Link>
          )}

          {/* ── Trust Strip ── */}
          <View style={s.trustStrip}>
            {TRUST_ITEMS.map((item, i) => (
              <React.Fragment key={i}>
                <View style={s.trustItem}>
                  <View style={s.trustIconWrap}>{item.icon}</View>
                  <Text style={s.trustLabel}>{item.label}</Text>
                  <Text style={s.trustSub}>{item.sub}</Text>
                </View>
                {i < TRUST_ITEMS.length - 1 && <View style={s.trustDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* ── Login row ── */}
          <View style={s.loginRow}>
            <Text style={s.loginText}>Already have an account? </Text>
            <Link href="/auth/login-patient" asChild>
              <Pressable style={s.loginLinkRow}>
                <Text style={s.loginLink}>Log in</Text>
                <ChevronRight size={16} color="#138A8A" />
              </Pressable>
            </Link>
          </View>

          {/* Home indicator */}
          <View style={s.homeIndicatorWrap}>
            <View style={s.homeIndicator} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { alignItems: "center", flexGrow: 1 },
  phone: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: "center",
  },

  // Logo
  logoSection: { alignItems: "center", marginBottom: 8 },
  logoTitle: { fontSize: 28, marginTop: 4 },
  logoNavy: { fontWeight: "900", color: "#0B2545" },
  logoTeal: { fontWeight: "900", color: "#138A8A" },
  logoTagline: { fontSize: 14, color: "#707588", marginTop: 2 },

  // Heading
  headingSection: { alignItems: "center", marginVertical: 28 },
  heading: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0B2545",
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 12,
  },
  subheading: {
    fontSize: 16,
    color: "#707588",
    textAlign: "center",
    lineHeight: 24,
  },

  // Role cards
  cardsSection: { width: "100%", gap: 16, marginBottom: 20 },
  roleCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 2,
  },
  patientCard: {
    backgroundColor: "#F0FAF9",
    borderColor: "#C5E8E8",
  },
  physioCard: {
    backgroundColor: "#FDF6EE",
    borderColor: "#F0E0CC",
  },
  roleCardSelected: {
    borderWidth: 2.5,
    shadowColor: "#138A8A",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  patientCardSelected: { borderColor: "#138A8A" },
  physioCardSelected: { borderColor: "#138A8A" },

  roleIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  patientIconWrap: { backgroundColor: "#DDF0EF" },
  physioIconWrap: { backgroundColor: "#FDEBD8" },

  roleTextWrap: { flex: 1 },
  roleTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#138A8A",
    marginBottom: 6,
  },
  roleDesc: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 21,
  },

  // Continue button
  continueBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#138A8A",
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 24,
    shadowColor: "#138A8A",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  continueBtnText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },

  // Trust strip
  trustStrip: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 28,
    paddingTop: 8,
  },
  trustItem: { flex: 1, alignItems: "center", gap: 6 },
  trustIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#E6F4F4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  trustLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0B2545",
    textAlign: "center",
    lineHeight: 17,
  },
  trustSub: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 15,
  },
  trustDivider: {
    width: 1,
    height: 70,
    backgroundColor: "#EAECEF",
    marginTop: 10,
  },

  // Login row
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  loginText: { fontSize: 15, color: "#707588" },
  loginLinkRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  loginLink: { fontSize: 15, fontWeight: "800", color: "#138A8A" },

  // Home indicator
  homeIndicatorWrap: { alignItems: "center", paddingBottom: 4 },
  homeIndicator: {
    width: 130,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#0B2545",
  },
});
