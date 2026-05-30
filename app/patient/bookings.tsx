import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
} from "react-native";
import {
  Menu,
  Bell,
  Search,
  SlidersHorizontal,
  MapPin,
  ChevronRight,
  LayoutGrid,
  Star,
  ShieldCheck,
  House,
  Lock,
  CalendarDays,
  MessageCircle,
  Clock,
  CheckCircle,
} from "lucide-react-native";

// ─── Static Data ─────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All Services", icon: "grid" },
  { id: "spine", label: "Back & Spine", icon: "spine" },
  { id: "knee", label: "Knee & Joint", icon: "knee" },
  { id: "sports", label: "Sports Injury", icon: "sports" },
  { id: "surgery", label: "Post Surgery", icon: "surgery" },
];

const TOP_PHYSIOS = [
  {
    id: "1",
    name: "Dr. James Mwangi",
    specialty: "Spine Specialist",
    rating: 4.9,
    reviews: 120,
    distance: "2.3 km away",
    exp: "8+ yrs exp",
    availability: "Available now",
    availType: "now",
    price: "KES 2,000",
    tags: ["Back Pain", "Sciatica", "Posture", "Spinal Mobilization"],
    initials: "JM",
    color: "#138A8A",
  },
  {
    id: "2",
    name: "Dr. Grace Achieng'",
    specialty: "Sports Injury Specialist",
    rating: 4.8,
    reviews: 96,
    distance: "3.1 km away",
    exp: "6+ yrs exp",
    availability: "Available tomorrow at 10:00 AM",
    availType: "tomorrow",
    price: "KES 2,000",
    tags: ["Sports Injury", "Rehab", "Kinesiology", "Taping"],
    initials: "GA",
    color: "#7C3AED",
  },
];

const NEARBY_PHYSIOS = [
  {
    id: "3",
    name: "Dr. Samuel Otieno",
    specialty: "Knee & Joint Specialist",
    distance: "1.8 km away",
    availability: "Available in 30 min",
    availType: "soon",
    price: "KES 2,000",
    initials: "SO",
    color: "#138A8A",
  },
  {
    id: "4",
    name: "Dr. Mary Wanjiku",
    specialty: "Spine & Posture Specialist",
    distance: "2.4 km away",
    availability: "Available today at 3:00 PM",
    availType: "today",
    price: "KES 2,000",
    initials: "MW",
    color: "#5FA7A7",
  },
  {
    id: "5",
    name: "Dr. Brian Kamau",
    specialty: "Rehabilitation Specialist",
    distance: "3.0 km away",
    availability: "Available now",
    availType: "now",
    price: "KES 2,000",
    initials: "BK",
    color: "#087F83",
  },
];

const TRUST_ITEMS = [
  {
    icon: <ShieldCheck size={18} color="#138A8A" />,
    label: "Verified Experts",
  },
  { icon: <House size={18} color="#138A8A" />, label: "At-Home Care" },
  { icon: <Lock size={18} color="#138A8A" />, label: "Secure Payments" },
  { icon: <CalendarDays size={18} color="#138A8A" />, label: "Quick Booking" },
];

// ─── Helpers ──────────────────────────────────────────────────────
function availColor(type: string) {
  if (type === "now") return "#138A8A";
  if (type === "soon") return "#138A8A";
  if (type === "today") return "#F59E0B";
  return "#F59E0B";
}

function AvailIcon({ type }: { type: string }) {
  if (type === "now" || type === "soon")
    return (
      <CheckCircle size={12} color={availColor(type)} fill={availColor(type)} />
    );
  return <Clock size={12} color={availColor(type)} />;
}

function CategoryIcon({ type, active }: { type: string; active: boolean }) {
  const color = active ? "#fff" : "#138A8A";
  return <LayoutGrid size={20} color={color} />;
}

// ─── Main Screen ──────────────────────────────────────────────────
export default function BookingsScreen() {
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.phone}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Pressable style={s.menuBtn}>
              <Menu size={26} color="#0B2545" strokeWidth={2} />
            </Pressable>
            <View>
              <Text style={s.headerTitle}>Book a Session</Text>
              <Text style={s.headerSub}>
                Find a verified physiotherapist near you
              </Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Pressable style={s.bellWrap}>
              <Bell size={24} color="#0B2545" strokeWidth={2} />
              <View style={s.notifBadge}>
                <Text style={s.notifText}>2</Text>
              </View>
            </Pressable>
            <View style={s.avatarSmall}>
              <Text style={s.avatarSmallText}>P</Text>
              <View style={s.avatarOnline} />
            </View>
          </View>
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Search */}
          <View style={s.searchBar}>
            <Search size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={s.searchInput}
              placeholder="Search by name, specialty or symptom..."
              placeholderTextColor="#9CA3AF"
            />
            <Pressable style={s.filterBtn}>
              <SlidersHorizontal size={18} color="#707588" />
            </Pressable>
          </View>

          {/* Location */}
          <View style={s.locationRow}>
            <MapPin size={16} color="#138A8A" />
            <Text style={s.locationText}>Nairobi, Kenya</Text>
            <Pressable style={s.changeRow}>
              <Text style={s.changeText}>Change</Text>
              <ChevronRight size={14} color="#138A8A" />
            </Pressable>
          </View>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.categoriesScroll}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[s.categoryBtn, isActive && s.categoryBtnActive]}
                  onPress={() => setActiveCategory(cat.id)}
                >
                  <CategoryIcon type={cat.icon} active={isActive} />
                  <Text
                    style={[s.categoryLabel, isActive && s.categoryLabelActive]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ── Top Rated ── */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Top Rated Physiotherapists</Text>
            <Pressable style={s.viewAllRow}>
              <Text style={s.viewAll}>View all</Text>
              <ChevronRight size={14} color="#138A8A" />
            </Pressable>
          </View>

          {TOP_PHYSIOS.map((p) => (
            <View key={p.id} style={s.topCard}>
              {/* Avatar + view profile */}
              <View style={s.topCardLeft}>
                <View style={[s.avatar, { backgroundColor: p.color }]}>
                  <Text style={s.avatarInitials}>{p.initials}</Text>
                  <View style={s.verifiedBadge}>
                    <CheckCircle size={14} color="#fff" fill="#138A8A" />
                  </View>
                </View>
                <Pressable style={s.viewProfileRow}>
                  <Text style={s.viewProfileText}>View Profile</Text>
                  <ChevronRight size={13} color="#138A8A" />
                </Pressable>
              </View>

              {/* Info */}
              <View style={s.topCardInfo}>
                <View style={s.topCardInfoTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.physioName}>{p.name}</Text>
                    <Text style={s.physioSpecialty}>{p.specialty}</Text>
                    <View style={s.metaRow}>
                      <Star size={13} color="#F59E0B" fill="#F59E0B" />
                      <Text style={s.rating}>{p.rating}</Text>
                      <Text style={s.reviews}>({p.reviews} reviews)</Text>
                      <Text style={s.metaDot}>•</Text>
                      <Text style={s.distance}>{p.distance}</Text>
                    </View>
                    <View style={s.expRow}>
                      <ShieldCheck size={13} color="#707588" />
                      <Text style={s.expText}>{p.exp}</Text>
                    </View>
                  </View>
                  {/* Price top right */}
                  <View style={s.priceWrap}>
                    <Text style={s.priceAmount}>{p.price}</Text>
                    <Text style={s.pricePer}> / session</Text>
                  </View>
                </View>

                {/* Availability pill */}
                <View
                  style={[
                    s.availPill,
                    { borderColor: availColor(p.availType) },
                  ]}
                >
                  <AvailIcon type={p.availType} />
                  <Text
                    style={[s.availText, { color: availColor(p.availType) }]}
                  >
                    {p.availability}
                  </Text>
                </View>

                {/* Tags */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={s.tagsRow}>
                    {p.tags.map((tag) => (
                      <View key={tag} style={s.tag}>
                        <Text style={s.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* Buttons */}
                <View style={s.topCardBtns}>
                  <Pressable style={s.chatBtn}>
                    <MessageCircle size={15} color="#0B2545" />
                    <Text style={s.chatBtnText}>Chat</Text>
                  </Pressable>
                  {p.availType === "tomorrow" ? (
                    <Pressable style={s.nextTimeBtn}>
                      <Text style={s.nextTimeBtnText}>View Next Time</Text>
                    </Pressable>
                  ) : (
                    <Pressable style={s.bookSessionBtn}>
                      <Text style={s.bookSessionBtnText}>Book Session</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          ))}

          {/* ── Available Nearby Now ── */}
          <View style={s.sectionHeader}>
            <View style={s.nearbyTitleRow}>
              <Text style={s.sectionTitle}>Available Nearby Now</Text>
              <View style={s.nearbyBadge}>
                <Text style={s.nearbyBadgeText}>32 available now</Text>
              </View>
            </View>
            <Pressable style={s.viewAllRow}>
              <Text style={s.viewAll}>View all</Text>
              <ChevronRight size={14} color="#138A8A" />
            </Pressable>
          </View>

          <View style={s.nearbyCard}>
            {NEARBY_PHYSIOS.map((p, i) => (
              <View
                key={p.id}
                style={[
                  s.nearbyRow,
                  i < NEARBY_PHYSIOS.length - 1 && s.nearbyRowBorder,
                ]}
              >
                {/* Avatar */}
                <View style={s.nearbyAvatarWrap}>
                  <View style={[s.nearbyAvatar, { backgroundColor: p.color }]}>
                    <Text style={s.nearbyAvatarInitials}>{p.initials}</Text>
                  </View>
                  <View style={s.nearbyVerified}>
                    <CheckCircle size={13} color="#fff" fill="#138A8A" />
                  </View>
                </View>

                {/* Info */}
                <View style={s.nearbyInfo}>
                  <Text style={s.nearbyName}>{p.name}</Text>
                  <Text style={s.nearbySpecialty}>{p.specialty}</Text>
                  <View style={s.nearbyMeta}>
                    <MapPin size={12} color="#707588" />
                    <Text style={s.nearbyDistance}>{p.distance}</Text>
                    <View
                      style={[
                        s.nearbyDot,
                        { backgroundColor: availColor(p.availType) },
                      ]}
                    />
                    <Text
                      style={[
                        s.nearbyAvail,
                        { color: availColor(p.availType) },
                      ]}
                    >
                      {p.availability}
                    </Text>
                  </View>
                </View>

                {/* Price + button */}
                <View style={s.nearbyRight}>
                  <Text style={s.nearbyPrice}>
                    <Text style={s.nearbyPriceAmount}>{p.price}</Text>
                    <Text style={s.nearbyPricePer}> / session</Text>
                  </Text>
                  <Pressable style={s.bookNowBtn}>
                    <Text style={s.bookNowText}>Book Now</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          {/* Not sure card */}
          <View style={s.matchCard}>
            <View style={s.matchLeft}>
              <Text style={s.matchTitle}>{"Not sure who to choose?"}</Text>
              <Text style={s.matchSub}>
                {
                  "Tell us your condition and we'll match you with the best available physiotherapist."
                }
              </Text>
            </View>
            <View style={s.matchIllustration}>
              <View style={s.clipboardIcon}>
                <Text style={s.clipboardEmoji}>📋</Text>
                <View style={s.checkBadge}>
                  <CheckCircle size={16} color="#fff" fill="#138A8A" />
                </View>
              </View>
            </View>
            <Pressable style={s.matchBtn}>
              <Text style={s.matchBtnText}>Request a Match</Text>
            </Pressable>
          </View>

          {/* Trust strip */}
          <View style={s.trustStrip}>
            {TRUST_ITEMS.map((item, i) => (
              <View key={i} style={s.trustItem}>
                <View style={s.trustIconWrap}>{item.icon}</View>
                <Text style={s.trustLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

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
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#0B2545" },
  headerSub: { fontSize: 12, color: "#707588", marginTop: 1 },
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
  avatarSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#5FA7A7",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarSmallText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  avatarOnline: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#F7F8FA",
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 14, paddingTop: 4 },

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
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#0B2545" },
  filterBtn: {
    padding: 4,
    borderLeftWidth: 1,
    borderLeftColor: "#EAECEF",
    paddingLeft: 12,
  },

  // Location
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 8,
    borderWidth: 1,
    borderColor: "#EAECEF",
  },
  locationText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#0B2545" },
  changeRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  changeText: { fontSize: 14, fontWeight: "700", color: "#138A8A" },

  // Categories
  categoriesScroll: { gap: 10 },
  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EAECEF",
  },
  categoryBtnActive: { backgroundColor: "#138A8A", borderColor: "#138A8A" },
  categoryLabel: { fontSize: 13, fontWeight: "700", color: "#0B2545" },
  categoryLabelActive: { color: "#fff" },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#0B2545" },
  viewAllRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAll: { fontSize: 13, fontWeight: "700", color: "#138A8A" },
  nearbyTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  nearbyBadge: {
    backgroundColor: "#E6F4F4",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  nearbyBadgeText: { fontSize: 12, fontWeight: "700", color: "#138A8A" },

  // Top rated card
  topCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  topCardLeft: { alignItems: "center", gap: 10 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarInitials: { color: "#fff", fontSize: 24, fontWeight: "800" },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  viewProfileRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewProfileText: { fontSize: 12, fontWeight: "700", color: "#138A8A" },
  topCardInfo: { flex: 1, gap: 8 },
  topCardInfoTop: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  physioName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0B2545",
    marginBottom: 2,
  },
  physioSpecialty: { fontSize: 13, color: "#707588", marginBottom: 4 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  rating: { fontSize: 13, fontWeight: "700", color: "#0B2545" },
  reviews: { fontSize: 12, color: "#9CA3AF" },
  metaDot: { color: "#D1D5DB", fontSize: 12 },
  distance: { fontSize: 12, color: "#707588" },
  expRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  expText: { fontSize: 12, color: "#707588" },
  priceWrap: { flexDirection: "row", alignItems: "baseline" },
  priceAmount: { fontSize: 14, fontWeight: "900", color: "#138A8A" },
  pricePer: { fontSize: 11, color: "#9CA3AF" },

  // Availability pill
  availPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  availText: { fontSize: 12, fontWeight: "700" },

  // Tags
  tagsRow: { flexDirection: "row", gap: 6 },
  tag: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: { fontSize: 12, color: "#0B2545", fontWeight: "500" },

  // Top card buttons
  topCardBtns: { flexDirection: "row", gap: 8 },
  chatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingVertical: 10,
  },
  chatBtnText: { fontSize: 14, fontWeight: "700", color: "#0B2545" },
  bookSessionBtn: {
    flex: 1,
    backgroundColor: "#138A8A",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bookSessionBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  nextTimeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#F59E0B",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  nextTimeBtnText: { color: "#F59E0B", fontSize: 14, fontWeight: "800" },

  // Nearby card
  nearbyCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  nearbyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 10,
  },
  nearbyRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  nearbyAvatarWrap: { position: "relative" },
  nearbyAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  nearbyAvatarInitials: { color: "#fff", fontSize: 18, fontWeight: "800" },
  nearbyVerified: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  nearbyInfo: { flex: 1 },
  nearbyName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0B2545",
    marginBottom: 2,
  },
  nearbySpecialty: { fontSize: 12, color: "#707588", marginBottom: 4 },
  nearbyMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  nearbyDistance: { fontSize: 12, color: "#707588" },
  nearbyDot: { width: 6, height: 6, borderRadius: 3 },
  nearbyAvail: { fontSize: 12, fontWeight: "600" },
  nearbyRight: { alignItems: "flex-end", gap: 6 },
  nearbyPrice: { flexDirection: "row", alignItems: "baseline" },
  nearbyPriceAmount: { fontSize: 13, fontWeight: "800", color: "#0B2545" },
  nearbyPricePer: { fontSize: 11, color: "#9CA3AF" },
  bookNowBtn: {
    backgroundColor: "#138A8A",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  bookNowText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  // Match card
  matchCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#EAECEF",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  matchLeft: { flex: 1 },
  matchTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0B2545",
    marginBottom: 6,
  },
  matchSub: { fontSize: 12, color: "#707588", lineHeight: 18 },
  matchIllustration: { alignItems: "center", justifyContent: "center" },
  clipboardIcon: { position: "relative" },
  clipboardEmoji: { fontSize: 32 },
  checkBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  matchBtn: {
    backgroundColor: "#138A8A",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  matchBtnText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  // Trust strip
  trustStrip: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  trustItem: { flex: 1, alignItems: "center", gap: 6 },
  trustIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#E6F4F4",
    alignItems: "center",
    justifyContent: "center",
  },
  trustLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0B2545",
    textAlign: "center",
  },
});
