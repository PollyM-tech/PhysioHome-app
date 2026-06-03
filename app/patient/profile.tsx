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
  ChevronLeft,
  Settings,
  Pencil,
  CalendarDays,
  CheckCircle,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  Users,
  Footprints,
  MessageSquare,
  PlusSquare,
  PhoneCall,
  Home,
  MoreVertical,
  PlusCircle,
  Bell,
  CreditCard,
  HelpCircle,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Heart,
} from "lucide-react-native";
import { clearServerSessionCookies } from "@/lib/security/session-client";

// ─── Static Data ─────────────────────────────────────────────────
const PERSONAL_INFO = [
  {
    icon: <User size={18} color="#707588" />,
    label: "Full Name",
    value: "Pauline N.",
  },
  {
    icon: <Phone size={18} color="#707588" />,
    label: "Phone Number",
    value: "+254 712 345 678",
  },
  {
    icon: <Mail size={18} color="#707588" />,
    label: "Email",
    value: "pauline.njeri@email.com",
  },
  {
    icon: <Calendar size={18} color="#707588" />,
    label: "Date of Birth",
    value: "15 March 1985",
  },
  {
    icon: <Users size={18} color="#707588" />,
    label: "Gender",
    value: "Female",
  },
];

const CARE_DETAILS = [
  {
    icon: <Footprints size={18} color="#707588" />,
    label: "Mobility Needs",
    value: "Walks independently",
  },
  {
    icon: <MessageSquare size={18} color="#707588" />,
    label: "Preferred Communication",
    value: "Phone Calls & SMS",
  },
  {
    icon: <PlusSquare size={18} color="#707588" />,
    label: "Common Condition",
    value: "Lower Back Pain",
  },
];

const ADDRESSES = [
  { label: "Home - Westlands", sub: "Westlands, Nairobi" },
  { label: "Mum's House - Kilimani", sub: "Kilimani, Nairobi" },
];

const SETTINGS = [
  { icon: <Bell size={18} color="#707588" />, label: "Notifications" },
  { icon: <CreditCard size={18} color="#707588" />, label: "Payment Methods" },
  { icon: <HelpCircle size={18} color="#707588" />, label: "Help & Support" },
  {
    icon: <ShieldCheck size={18} color="#707588" />,
    label: "Privacy & Security",
  },
];

// ─── Main Screen ─────────────────────────────────────────────────
export default function ProfileScreen() {
  const handleLogout = async () => {
    try {
      await clearServerSessionCookies();
      router.replace("/auth/login-patient");
    } catch {
      Alert.alert(
        "Sign out unavailable",
        "We could not sign you out. Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.phone}>
          {/* Top nav */}
          <View style={s.topNav}>
            <Pressable style={s.navBtn}>
              <ChevronLeft size={24} color="#0B2545" />
            </Pressable>
            <Text style={s.navTitle}>My Profile</Text>
            <Pressable style={s.navBtn}>
              <Settings size={22} color="#0B2545" />
            </Pressable>
          </View>

          <View style={s.body}>
            {/* Profile card */}
            <View style={s.profileCard}>
              <View style={s.avatarWrap}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>P</Text>
                </View>
              </View>
              <View style={s.profileInfo}>
                <Text style={s.profileName}>Pauline N.</Text>
                <View style={s.patientBadge}>
                  <Text style={s.patientBadgeText}>Patient</Text>
                </View>
                <Text style={s.profileTagline}>Managing your care at home</Text>
              </View>
              <Pressable style={s.editBtn}>
                <Pencil size={15} color="#138A8A" />
                <Text style={s.editBtnText}>Edit Profile</Text>
              </Pressable>
            </View>

            {/* Stats row */}
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <View style={s.statIconWrap}>
                  <CalendarDays size={22} color="#138A8A" />
                </View>
                <Text style={s.statNum}>3</Text>
                <Text style={s.statLabel}>Active Bookings</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <View style={s.statIconWrap}>
                  <CheckCircle size={22} color="#138A8A" />
                </View>
                <Text style={s.statNum}>12</Text>
                <Text style={s.statLabel}>Completed Sessions</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <View style={s.statIconWrap}>
                  <MapPin size={22} color="#138A8A" />
                </View>
                <Text style={s.statNum}>2</Text>
                <Text style={s.statLabel}>Saved Locations</Text>
              </View>
            </View>

            {/* Personal Information */}
            <SectionCard
              icon={<User size={20} color="#138A8A" />}
              title="Personal Information"
            >
              {PERSONAL_INFO.map((item, i) => (
                <InfoRow
                  key={i}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  last={i === PERSONAL_INFO.length - 1}
                />
              ))}
            </SectionCard>

            {/* Care Details */}
            <SectionCard
              icon={<Heart size={20} color="#138A8A" />}
              title="Care Details"
            >
              {CARE_DETAILS.map((item, i) => (
                <InfoRow
                  key={i}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  last={i === CARE_DETAILS.length - 1}
                />
              ))}
            </SectionCard>

            {/* Emergency + Addresses row */}
            <View style={s.twoCol}>
              {/* Emergency Contact */}
              <View style={[s.halfCard, { flex: 1 }]}>
                <View style={s.halfCardHeader}>
                  <View
                    style={[s.sectionIconWrap, { backgroundColor: "#FEE2E2" }]}
                  >
                    <PhoneCall size={18} color="#E53E3E" />
                  </View>
                  <Text style={s.halfCardTitle}>Emergency Contact</Text>
                </View>
                <View style={s.emergencyRows}>
                  {[
                    { label: "Name", value: "James N." },
                    { label: "Relationship", value: "Husband" },
                    { label: "Phone Number", value: "+254 720 987 654" },
                  ].map((r, i) => (
                    <View key={i} style={s.emergencyRow}>
                      <Text style={s.emergencyLabel}>{r.label}</Text>
                      <Text style={s.emergencyValue}>{r.value}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Saved Addresses */}
              <View style={[s.halfCard, { flex: 1 }]}>
                <View style={s.halfCardHeader}>
                  <View style={s.sectionIconWrap}>
                    <MapPin size={18} color="#138A8A" />
                  </View>
                  <Text style={s.halfCardTitle}>Saved Addresses</Text>
                </View>
                <View style={s.addressList}>
                  {ADDRESSES.map((addr, i) => (
                    <View key={i} style={s.addressRow}>
                      <View style={s.addressIconWrap}>
                        <Home size={14} color="#138A8A" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.addressLabel}>{addr.label}</Text>
                        <Text style={s.addressSub}>{addr.sub}</Text>
                      </View>
                      <Pressable>
                        <MoreVertical size={16} color="#9CA3AF" />
                      </Pressable>
                    </View>
                  ))}
                  <Pressable style={s.addAddressRow}>
                    <PlusCircle size={16} color="#138A8A" />
                    <Text style={s.addAddressText}>Add New Address</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Settings & Support */}
            <SectionCard
              icon={<Settings size={20} color="#138A8A" />}
              title="Settings & Support"
            >
              {SETTINGS.map((item, i) => (
                <Pressable
                  key={i}
                  style={[
                    s.settingsRow,
                    i < SETTINGS.length - 1 && s.settingsRowBorder,
                  ]}
                >
                  <View style={s.settingsLeft}>
                    {item.icon}
                    <Text style={s.settingsLabel}>{item.label}</Text>
                  </View>
                  <ChevronRight size={18} color="#D1D5DB" />
                </Pressable>
              ))}

              {/* Log Out */}
              <Pressable style={s.logoutRow} onPress={handleLogout}>
                <View style={s.settingsLeft}>
                  <LogOut size={18} color="#E53E3E" />
                  <Text style={s.logoutText}>Log Out</Text>
                </View>
                <ChevronRight size={18} color="#E53E3E" />
              </Pressable>
            </SectionCard>

            <View style={{ height: 24 }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Reusable Components ──────────────────────────────────────────
function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.sectionCard}>
      <View style={s.sectionCardHeader}>
        <View style={s.sectionIconWrap}>{icon}</View>
        <Text style={s.sectionCardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[s.infoRow, !last && s.infoRowBorder]}>
      <View style={s.infoLeft}>
        {icon}
        <Text style={s.infoLabel}>{label}</Text>
      </View>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F8FA" },
  scroll: { flex: 1 },
  scrollContent: { alignItems: "center" },
  phone: { width: "100%", maxWidth: 430, backgroundColor: "#F7F8FA" },

  // Top nav
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F7F8FA",
  },
  navBtn: { padding: 6 },
  navTitle: { fontSize: 17, fontWeight: "800", color: "#0B2545" },

  body: { paddingHorizontal: 16, gap: 14 },

  // Profile card
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    borderColor: "#E6F4F4",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5FA7A7",
  },
  avatar: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 30, fontWeight: "800" },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0B2545",
    marginBottom: 6,
  },
  patientBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E6F4F4",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  patientBadgeText: { fontSize: 12, fontWeight: "700", color: "#138A8A" },
  profileTagline: { fontSize: 12, color: "#707588" },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#138A8A",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  editBtnText: { fontSize: 13, fontWeight: "700", color: "#138A8A" },

  // Stats
  statsRow: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: "center", gap: 6 },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E6F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  statNum: { fontSize: 22, fontWeight: "900", color: "#0B2545" },
  statLabel: {
    fontSize: 11,
    color: "#707588",
    textAlign: "center",
    fontWeight: "600",
  },
  statDivider: { width: 1, height: 60, backgroundColor: "#F0F1F3" },

  // Section card
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#E6F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCardTitle: { fontSize: 16, fontWeight: "800", color: "#0B2545" },

  // Info rows
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoLabel: { fontSize: 14, color: "#0B2545", fontWeight: "500" },
  infoValue: { fontSize: 13, color: "#707588", fontWeight: "500" },

  // Two column
  twoCol: { flexDirection: "row", gap: 12 },
  halfCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  halfCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  halfCardTitle: { fontSize: 13, fontWeight: "800", color: "#0B2545", flex: 1 },

  // Emergency
  emergencyRows: { gap: 10 },
  emergencyRow: { gap: 2 },
  emergencyLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600" },
  emergencyValue: { fontSize: 13, color: "#0B2545", fontWeight: "700" },

  // Addresses
  addressList: { gap: 10 },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addressIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#E6F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  addressLabel: { fontSize: 12, fontWeight: "700", color: "#0B2545" },
  addressSub: { fontSize: 11, color: "#707588" },
  addAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  addAddressText: { fontSize: 13, fontWeight: "700", color: "#138A8A" },

  // Settings
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  settingsLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingsLabel: { fontSize: 14, color: "#0B2545", fontWeight: "500" },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  logoutText: { fontSize: 14, color: "#E53E3E", fontWeight: "700" },
});
