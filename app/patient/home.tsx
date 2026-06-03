import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  TextInput,
  StyleSheet,
} from "react-native";
import {
  Menu,
  Bell,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  House,
  CalendarDays,
  Lock,
  ArrowRight,
  ChevronRight,
  MapPin,
  Star,
  Search as SearchIcon,
  List,
  Home as HomeIcon,
  CalendarCheck,
} from "lucide-react-native";

// ─── Static Data ─────────────────────────────────────────────────
const SERVICES = [
  { id: "1", label: "Spine Pain", color: "#E8F5F0", iconColor: "#138A8A" },
  { id: "2", label: "Knee Therapy", color: "#E8F5E8", iconColor: "#2E7D32" },
  { id: "3", label: "Neck Pain", color: "#EEE8F5", iconColor: "#6A3EA1" },
  { id: "4", label: "Sports Injury", color: "#FFF3E0", iconColor: "#E65100" },
  { id: "5", label: "Stroke Rehab", color: "#F3E8F5", iconColor: "#7B1FA2" },
  { id: "6", label: "Post Surgery", color: "#E8EEF5", iconColor: "#1565C0" },
];

const PHYSIOS = [
  {
    id: "1",
    name: "Dr. James Mwangi",
    specialty: "Spine Specialist",
    rating: 4.9,
    distance: "2.3 km away",
    initials: "JM",
    color: "#138A8A",
  },
  {
    id: "2",
    name: "Dr. Grace Achieng'",
    specialty: "Sports Injury Specialist",
    rating: 4.8,
    distance: "3.1 km away",
    initials: "GA",
    color: "#087F83",
  },
  {
    id: "3",
    name: "Dr. Samuel Otieno",
    specialty: "Knee & Joint Specialist",
    rating: 4.7,
    distance: "4.0 km away",
    initials: "SO",
    color: "#5FA7A7",
  },
];

const HOW_IT_WORKS = [
  { step: 1, label: "Search\nSymptoms", icon: "search" },
  { step: 2, label: "Choose\nService", icon: "list" },
  { step: 3, label: "Book\nSession", icon: "calendar" },
  { step: 4, label: "Get Care\nat Home", icon: "home" },
];

// ─── Service Icon Placeholders ────────────────────────────────────
function ServiceIconShape({
  color,
  iconColor,
}: {
  color: string;
  iconColor: string;
}) {
  return (
    <View style={[si.wrap, { backgroundColor: color }]}>
      <View style={[si.circle, { borderColor: iconColor }]} />
      <View style={[si.line, { backgroundColor: iconColor }]} />
    </View>
  );
}
const si = StyleSheet.create({
  wrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    position: "absolute",
  },
  line: {
    width: 3,
    height: 20,
    borderRadius: 2,
    position: "absolute",
    bottom: 6,
  },
});

// ─── How It Works Step Icon ───────────────────────────────────────
function StepIcon({ type }: { type: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    search: <SearchIcon size={20} color="#138A8A" />,
    list: <List size={20} color="#138A8A" />,
    calendar: <CalendarDays size={20} color="#138A8A" />,
    home: <HomeIcon size={20} color="#138A8A" />,
  };
  return <>{iconMap[type]}</>;
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function PatientHomeScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.phone}>
          {/* Header */}
          <View style={s.header}>
            <Pressable style={s.menuBtn}>
              <Menu size={26} color="#0B2545" strokeWidth={2} />
            </Pressable>
            <View style={s.headerRight}>
              <Pressable style={s.bellWrap}>
                <Bell size={24} color="#0B2545" strokeWidth={2} />
                <View style={s.notifBadge}>
                  <Text style={s.notifText}>2</Text>
                </View>
              </Pressable>
              <View style={s.avatarCircle}>
                <Text style={s.avatarText}>P</Text>
              </View>
            </View>
          </View>

          <View style={s.body}>
            {/* Greeting */}
            <View style={s.greetRow}>
              <Text style={s.greetNormal}>Good Morning, </Text>
              <Text style={s.greetBold}>Pauline</Text>
              <Text style={s.wave}> 👋</Text>
            </View>
            <Text style={s.greetSub}>How are you feeling today?</Text>

            {/* Search bar */}
            <View style={s.searchBar}>
              <Search size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                style={s.searchInput}
                placeholder="Search symptoms / enter your symptoms"
                placeholderTextColor="#9CA3AF"
              />
              <Pressable style={s.filterBtn}>
                <SlidersHorizontal size={18} color="#707588" />
              </Pressable>
            </View>

            {/* Hero Card */}
            <View style={s.heroCard}>
              <View style={s.heroLeft}>
                <Text style={s.heroTitle}>
                  Need Professional Physiotherapy at Home
                </Text>
                <Text style={s.heroSub}>
                  Physio helps reduce pain, improve movement, and support
                  recovery at home.
                </Text>
                <Pressable style={s.bookBtn} onPress={() => {}}>
                  <Text style={s.bookBtnText}>Book Now</Text>
                </Pressable>
              </View>
              <View style={s.heroRight}>
                <Image
                  source={require("../../assets/images/hero.png")}
                  style={s.heroImg}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Trust Strip */}
            <View style={s.trustStrip}>
              {[
                {
                  icon: <ShieldCheck size={20} color="#138A8A" />,
                  label: "Verified Experts",
                },
                {
                  icon: <House size={20} color="#138A8A" />,
                  label: "Care at Home",
                },
                {
                  icon: <CalendarDays size={20} color="#138A8A" />,
                  label: "Easy Booking",
                },
                {
                  icon: <Lock size={20} color="#138A8A" />,
                  label: "Secure Payments",
                },
              ].map((item, i) => (
                <View key={i} style={s.trustItem}>
                  <View style={s.trustIconWrap}>{item.icon}</View>
                  <Text style={s.trustLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* How It Works */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>How It Works</Text>
              <Text style={s.sectionSub}>
                Tell us your symptoms, choose a service, and book a licensed
                physiotherapist in minutes.
              </Text>
              <View style={s.howCard}>
                {HOW_IT_WORKS.map((step, i) => (
                  <React.Fragment key={step.step}>
                    <View style={s.howStep}>
                      <View style={s.howIconWrap}>
                        <StepIcon type={step.icon} />
                        <View style={s.stepBadge}>
                          <Text style={s.stepNum}>{step.step}</Text>
                        </View>
                      </View>
                      <Text style={s.howLabel}>{step.label}</Text>
                    </View>
                    {i < HOW_IT_WORKS.length - 1 && (
                      <ChevronRight
                        size={16}
                        color="#D1D5DB"
                        style={{ marginTop: 14 }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* Popular Services */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Popular Services</Text>
              <View style={s.servicesGrid}>
                {SERVICES.map((svc) => (
                  <Pressable key={svc.id} style={s.serviceItem}>
                    <ServiceIconShape
                      color={svc.color}
                      iconColor={svc.iconColor}
                    />
                    <Text style={s.serviceLabel}>{svc.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Top Rated Physios */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Top Rated Physiotherapists</Text>
                <Pressable style={s.viewAllRow}>
                  <Text style={s.viewAll}>View all</Text>
                  <ChevronRight size={14} color="#138A8A" />
                </Pressable>
              </View>
              <View style={s.physioList}>
                {PHYSIOS.map((p) => (
                  <View key={p.id} style={s.physioRow}>
                    <View
                      style={[s.physioAvatar, { backgroundColor: p.color }]}
                    >
                      <Text style={s.physioInitials}>{p.initials}</Text>
                    </View>
                    <View style={s.physioInfo}>
                      <Text style={s.physioName}>{p.name}</Text>
                      <Text style={s.physioSpecialty}>{p.specialty}</Text>
                      <View style={s.physioMeta}>
                        <Star size={13} color="#F59E0B" fill="#F59E0B" />
                        <Text style={s.physioRating}>{p.rating}</Text>
                        <Text style={s.physioDot}>•</Text>
                        <MapPin size={12} color="#707588" />
                        <Text style={s.physioDistance}>{p.distance}</Text>
                      </View>
                    </View>
                    <Pressable style={s.bookSessionBtn}>
                      <Text style={s.bookSessionText}>Book Session</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>

            {/* Quick Booking Banner */}
            <View style={s.quickBanner}>
              <View style={s.quickIconWrap}>
                <CalendarCheck size={28} color="#138A8A" />
              </View>
              <Text style={s.quickBannerText}>
                Find available physiotherapists and book in minutes.
              </Text>
              <Pressable style={s.quickBannerBtn}>
                <Text style={s.quickBannerBtnText}>Find Available</Text>
                <ArrowRight size={16} color="#138A8A" />
              </Pressable>
            </View>

            {/* Urgent Help */}
            <Pressable style={s.urgentCard}>
              <View style={s.urgentLeft}>
                <View style={s.urgentIconWrap}>
                  <Text style={s.urgentEmoji}>🚨</Text>
                </View>
                <View>
                  <Text style={s.urgentTitle}>Need urgent help?</Text>
                  <Text style={s.urgentSub}>
                    Request an emergency home visit
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#E53E3E" />
            </Pressable>

            <View style={{ height: 20 }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F8FA" },
  scroll: { flex: 1 },
  scrollContent: { alignItems: "center" },
  phone: { width: "100%", maxWidth: 430, backgroundColor: "#F7F8FA" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#F7F8FA",
  },
  menuBtn: { padding: 4 },
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
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#5FA7A7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#138A8A",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  body: { paddingHorizontal: 16, gap: 16 },

  // Greeting
  greetRow: { flexDirection: "row", alignItems: "center" },
  greetNormal: { fontSize: 20, color: "#0B2545" },
  greetBold: { fontSize: 20, fontWeight: "900", color: "#0B2545" },
  wave: { fontSize: 20 },
  greetSub: { fontSize: 15, color: "#707588", marginTop: -8 },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#EAECEF",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0B2545" },
  filterBtn: {
    padding: 4,
    borderLeftWidth: 1,
    borderLeftColor: "#EAECEF",
    paddingLeft: 12,
  },

  // Hero card
  heroCard: {
    flexDirection: "row",
    backgroundColor: "#EAF5F5",
    borderRadius: 20,
    overflow: "hidden",
    minHeight: 200,
  },
  heroLeft: { flex: 1, padding: 18, justifyContent: "center" },
  heroTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0B2545",
    marginBottom: 8,
    lineHeight: 28,
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(11,37,69,0.72)",
    lineHeight: 19,
    marginBottom: 16,
  },
  bookBtn: {
    backgroundColor: "#138A8A",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: "flex-start",
  },
  bookBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  heroRight: { width: 170, overflow: "hidden" },
  heroImg: { width: "100%", height: "100%" },

  // Trust strip
  trustStrip: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 4,
  },
  trustItem: { flex: 1, alignItems: "center", gap: 6 },
  trustIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E6F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  trustLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0B2545",
    textAlign: "center",
    lineHeight: 15,
  },

  // Sections
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#0B2545" },
  sectionSub: { fontSize: 13, color: "#707588", lineHeight: 19, marginTop: -6 },
  viewAllRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAll: { fontSize: 14, fontWeight: "700", color: "#138A8A" },

  // How It Works
  howCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  howStep: { flex: 1, alignItems: "center" },
  howIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E6F4F4",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 8,
  },
  stepBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#138A8A",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: { color: "#fff", fontSize: 10, fontWeight: "800" },
  howLabel: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: "#0B2545",
    lineHeight: 16,
  },

  // Services grid
  servicesGrid: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceItem: {
    width: "33.33%",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  serviceLabel: { fontSize: 13, fontWeight: "600", color: "#0B2545", flex: 1 },

  // Physio list
  physioList: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  physioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  physioAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  physioInitials: { color: "#fff", fontSize: 18, fontWeight: "800" },
  physioInfo: { flex: 1 },
  physioName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0B2545",
    marginBottom: 2,
  },
  physioSpecialty: { fontSize: 12, color: "#707588", marginBottom: 4 },
  physioMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  physioRating: { fontSize: 12, fontWeight: "700", color: "#0B2545" },
  physioDot: { color: "#D1D5DB", fontSize: 12 },
  physioDistance: { fontSize: 12, color: "#707588" },
  bookSessionBtn: {
    borderWidth: 1.5,
    borderColor: "#138A8A",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bookSessionText: { fontSize: 12, fontWeight: "700", color: "#138A8A" },

  // Quick banner
  quickBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#138A8A",
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickBannerText: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  quickBannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 4,
  },
  quickBannerBtnText: { fontSize: 13, fontWeight: "800", color: "#138A8A" },

  // Urgent card
  urgentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FED7D7",
  },
  urgentLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  urgentIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FED7D7",
    alignItems: "center",
    justifyContent: "center",
  },
  urgentEmoji: { fontSize: 20 },
  urgentTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#E53E3E",
    marginBottom: 2,
  },
  urgentSub: { fontSize: 12, color: "#707588" },
});
