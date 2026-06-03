import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import {
  Menu,
  Bell,
  Pencil,
  ShieldCheck,
  Star,
  MapPin,
  User,
  GraduationCap,
  FileText,
  Briefcase,
  Stethoscope,
  Lock,
  Globe,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import { clearServerSessionCookies } from "@/lib/security/session-client";

// ─── Section Row ──────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  sub,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  last?: boolean;
}) {
  return (
    <Pressable style={[s.infoRow, !last && s.infoRowBorder]}>
      <View style={s.infoIconWrap}>{icon}</View>
      <View style={s.infoText}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoSub}>{sub}</Text>
      </View>
      <View style={s.infoChevron}>
        <ChevronRight size={18} color="#D1D5DB" />
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────
export default function PhysioProfileScreen() {
  const handleLogout = async () => {
    try {
      await clearServerSessionCookies();
      router.replace("/auth/login-physio");
    } catch {
      Alert.alert(
        "Sign out unavailable",
        "We could not sign you out. Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.phone}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Pressable style={s.menuBtn}>
              <Menu size={26} color="#0B2545" strokeWidth={2} />
            </Pressable>
            <Text style={s.headerTitle}>Profile</Text>
          </View>
          <View style={s.headerRight}>
            <Pressable style={s.bellWrap}>
              <Bell size={24} color="#0B2545" strokeWidth={2} />
              <View style={s.notifBadge}>
                <Text style={s.notifText}>2</Text>
              </View>
            </Pressable>
            <View style={s.avatarWrap}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>JM</Text>
              </View>
              <View style={s.avatarOnline} />
            </View>
          </View>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Profile Card ── */}
          <View style={s.profileCard}>
            {/* Avatar */}
            <View style={s.profileAvatarWrap}>
              <View style={s.profileAvatar}>
                <Text style={s.profileAvatarText}>JM</Text>
              </View>
              <View style={s.profileOnlineDot} />
            </View>

            {/* Info */}
            <View style={s.profileInfo}>
              <View style={s.profileNameRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.profileName}>Dr. James</Text>
                  <Text style={s.profileRole}>Physiotherapist</Text>
                </View>
                <Pressable style={s.editBtn}>
                  <View style={s.editBtnIcon}>
                    <Pencil size={14} color="#138A8A" />
                  </View>
                  <Text style={s.editBtnText}>Edit Profile</Text>
                </Pressable>
              </View>

              {/* Badges */}
              <View style={s.badgesCol}>
                <View style={s.badgeRow}>
                  <View style={s.badgeIcon}>
                    <ShieldCheck size={14} color="#138A8A" />
                  </View>
                  <Text style={s.badgeText}>Verified Professional</Text>
                  <View style={s.verifiedDot} />
                </View>
                <View style={s.badgeRow}>
                  <View style={s.badgeIcon}>
                    <Star size={14} color="#707588" />
                  </View>
                  <Text style={s.badgeText}>4.8 (120+ Reviews)</Text>
                </View>
                <View style={s.badgeRow}>
                  <View style={s.badgeIcon}>
                    <MapPin size={14} color="#707588" />
                  </View>
                  <Text style={s.badgeText}>Nairobi, Kenya</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── About Me ── */}
          <Pressable style={s.aboutCard}>
            <View style={s.aboutIconWrap}>
              <User size={22} color="#138A8A" />
            </View>
            <View style={s.aboutText}>
              <Text style={s.aboutTitle}>About Me</Text>
              <Text style={s.aboutBody} numberOfLines={3}>
                Experienced physiotherapist specialized in musculoskeletal
                rehabilitation, sports injuries and post-surgical recovery.
                Passionate about helping patients move better and live
                pain-free.
              </Text>
            </View>
            <View style={s.aboutChevron}>
              <ChevronRight size={18} color="#D1D5DB" />
            </View>
          </Pressable>

          {/* ── Professional Information ── */}
          <Text style={s.sectionTitle}>Professional Information</Text>
          <View style={s.sectionCard}>
            <InfoRow
              icon={<GraduationCap size={20} color="#138A8A" />}
              label="Education"
              sub="BSc Physiotherapy, University of Nairobi"
            />
            <InfoRow
              icon={<FileText size={20} color="#138A8A" />}
              label="License & Certification"
              sub="PCP License No. PHY12345"
            />
            <InfoRow
              icon={<Briefcase size={20} color="#138A8A" />}
              label="Experience"
              sub="6+ Years"
            />
            <InfoRow
              icon={<Stethoscope size={20} color="#138A8A" />}
              label="Specializations"
              sub="Orthopedic Rehab, Sports Injuries, Post-Surgery Rehab"
              last
            />
          </View>

          {/* ── Account Settings ── */}
          <Text style={s.sectionTitle}>Account Settings</Text>
          <View style={s.sectionCard}>
            <InfoRow
              icon={<User size={20} color="#138A8A" />}
              label="Personal Information"
              sub="Name, Email, Phone Number"
            />
            <InfoRow
              icon={<Lock size={20} color="#138A8A" />}
              label="Security"
              sub="Change password, 2FA"
            />
            <InfoRow
              icon={<Bell size={20} color="#138A8A" />}
              label="Notifications"
              sub="Manage your notification preferences"
            />
            <InfoRow
              icon={<Globe size={20} color="#138A8A" />}
              label="Availability"
              sub="Manage your working hours and days"
            />
            <InfoRow
              icon={<CreditCard size={20} color="#138A8A" />}
              label="Payment Details"
              sub="Bank account, Payout information"
              last
            />
          </View>

          {/* ── Help & Support ── */}
          <View style={s.sectionCard}>
            <InfoRow
              icon={<HelpCircle size={20} color="#138A8A" />}
              label="Help & Support"
              sub="FAQs, Contact Support"
              last
            />
          </View>

          {/* ── Log Out ── */}
          <Pressable
            style={s.logoutCard}
            onPress={handleLogout}
          >
            <View style={s.logoutIconWrap}>
              <LogOut size={20} color="#E53E3E" />
            </View>
            <View style={s.logoutText}>
              <Text style={s.logoutTitle}>Log Out</Text>
              <Text style={s.logoutSub}>Sign out from your account</Text>
            </View>
            <View style={s.logoutChevron}>
              <ChevronRight size={18} color="#E53E3E" />
            </View>
          </Pressable>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F8FA" },
  phone: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    backgroundColor: "#F7F8FA",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#0B2545" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  bellWrap: { position: "relative", padding: 4 },
  notifBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E53E3E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#F7F8FA",
  },
  notifText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#138A8A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  avatarOnline: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#F7F8FA",
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 14, paddingTop: 4 },

  // Profile card
  profileCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
  },
  profileAvatarWrap: { position: "relative", flexShrink: 0 },
  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#138A8A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#E6F4F4",
  },
  profileAvatarText: { color: "#fff", fontSize: 28, fontWeight: "900" },
  profileOnlineDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    borderWidth: 2.5,
    borderColor: "#fff",
  },

  profileInfo: { flex: 1 },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0B2545",
    marginBottom: 2,
  },
  profileRole: { fontSize: 13, fontWeight: "700", color: "#138A8A" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  editBtnIcon: { alignItems: "center", justifyContent: "center" },
  editBtnText: { fontSize: 12, fontWeight: "700", color: "#138A8A" },

  badgesCol: { gap: 6 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  badgeIcon: { alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 13, color: "#0B2545", fontWeight: "500" },
  verifiedDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
  },

  // About card
  aboutCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  aboutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E6F4F4",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  aboutText: { flex: 1 },
  aboutTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0B2545",
    marginBottom: 6,
  },
  aboutBody: { fontSize: 13, color: "#707588", lineHeight: 20 },
  aboutChevron: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  // Section title
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#0B2545" },

  // Section card
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  // Info row
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#E6F4F4",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoText: { flex: 1 },
  infoLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0B2545",
    marginBottom: 2,
  },
  infoSub: { fontSize: 12, color: "#707588" },
  infoChevron: { alignItems: "center", justifyContent: "center" },

  // Logout
  logoutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoutText: { flex: 1 },
  logoutTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#E53E3E",
    marginBottom: 2,
  },
  logoutSub: { fontSize: 12, color: "#9CA3AF" },
  logoutChevron: { alignItems: "center", justifyContent: "center" },
});
