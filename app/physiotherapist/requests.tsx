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
} from "lucide-react-native";

// ─── Static Data ──────────────────────────────────────────────────
const FILTER_TABS = [
  { id: "all", label: "All Requests", count: 12 },
  { id: "new", label: "New", count: 1 },
  { id: "accepted", label: "Accepted", count: 6 },
  { id: "declined", label: "Declined", count: 5 },
];

const NEW_REQUESTS = [
  {
    id: "1",
    name: "Alice K.",
    initials: "AK",
    color: "#E6F4F4",
    textColor: "#138A8A",
    condition: "Neck Pain",
    location: "Kileleshwa, Nairobi",
    time: "Today, 9:20 AM",
    online: true,
  },
];

const ACCEPTED_REQUESTS = [
  {
    id: "1",
    name: "Pauline N.",
    initials: "PN",
    color: "#5FA7A7",
    condition: "Lower Back Pain",
    location: "Westlands, Nairobi",
    date: "May 31, 2024",
  },
  {
    id: "2",
    name: "Joseph K.",
    initials: "JK",
    color: "#087F83",
    condition: "Knee Rehabilitation",
    location: "Kilimani, Nairobi",
    date: "May 31, 2024",
  },
  {
    id: "3",
    name: "Mary W.",
    initials: "MW",
    color: "#138A8A",
    condition: "Post Surgery Therapy",
    location: "Lavington, Nairobi",
    date: "May 29, 2024",
  },
];

const DECLINED_REQUESTS = [
  {
    id: "1",
    name: "Sarah M.",
    initials: "SM",
    color: "#FEE2E2",
    textColor: "#E53E3E",
    condition: "Shoulder Pain",
    location: "Runda, Nairobi",
    date: "May 28, 2024",
  },
  {
    id: "2",
    name: "Brian T.",
    initials: "BT",
    color: "#FEE2E2",
    textColor: "#E53E3E",
    condition: "Sports Injury",
    location: "Ruaka, Nairobi",
    date: "May 25, 2024",
  },
];

// ─── Main Screen ──────────────────────────────────────────────────
export default function RequestsScreen() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

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
              <Text style={s.headerTitle}>Requests</Text>
              <Text style={s.headerSub}>Manage patient requests</Text>
            </View>
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
          {/* Filter tabs */}
          <View style={s.filterTabsCard}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.filterTabsScroll}
            >
              {FILTER_TABS.map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    style={[s.filterTab, isActive && s.filterTabActive]}
                    onPress={() => setActiveFilter(tab.id)}
                  >
                    <Text
                      style={[
                        s.filterTabText,
                        isActive && s.filterTabTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                    <View
                      style={[
                        s.filterTabBadge,
                        isActive && s.filterTabBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          s.filterTabBadgeText,
                          isActive && s.filterTabBadgeTextActive,
                        ]}
                      >
                        {tab.count}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Search + Filter */}
          <View style={s.searchRow}>
            <View style={s.searchBar}>
              <View style={s.searchIcon}>
                <Search size={18} color="#9CA3AF" />
              </View>
              <TextInput
                style={s.searchInput}
                placeholder="Search by patient name or service"
                placeholderTextColor="#9CA3AF"
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <Pressable style={s.filterBtn}>
              <View style={s.filterBtnIcon}>
                <SlidersHorizontal size={18} color="#707588" />
              </View>
              <Text style={s.filterBtnText}>Filter</Text>
            </Pressable>
          </View>

          {/* ── New Requests ── */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>New Requests</Text>
            <View style={s.sectionBadge}>
              <Text style={s.sectionBadgeText}>1</Text>
            </View>
          </View>

          {NEW_REQUESTS.map((req) => (
            <View key={req.id} style={s.newRequestCard}>
              <View style={s.newRequestTop}>
                {/* Avatar */}
                <View style={s.newAvatarWrap}>
                  <View style={[s.newAvatar, { backgroundColor: req.color }]}>
                    <Text style={[s.newAvatarText, { color: req.textColor }]}>
                      {req.initials}
                    </Text>
                  </View>
                  {req.online && <View style={s.newOnlineDot} />}
                </View>

                {/* Info */}
                <View style={s.newInfo}>
                  <Text style={s.newName}>{req.name}</Text>
                  <Text style={s.newCondition}>{req.condition}</Text>
                  <View style={s.newLocRow}>
                    <View style={s.newLocIcon}>
                      <MapPin size={12} color="#707588" />
                    </View>
                    <Text style={s.newLoc}>{req.location}</Text>
                  </View>
                </View>

                {/* Time + badge */}
                <View style={s.newRight}>
                  <Text style={s.newTime}>{req.time}</Text>
                  <View style={s.newBadge}>
                    <Text style={s.newBadgeText}>New</Text>
                  </View>
                </View>
              </View>

              {/* Buttons */}
              <View style={s.newRequestBtns}>
                <Pressable style={s.declineBtn}>
                  <Text style={s.declineBtnText}>Decline</Text>
                </Pressable>
                <Pressable style={s.acceptBtn}>
                  <Text style={s.acceptBtnText}>Accept</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {/* ── Accepted Requests ── */}
          <View style={s.sectionHeaderRow}>
            <View style={s.sectionHeaderLeft}>
              <Text style={s.sectionTitle}>Accepted Requests</Text>
              <View style={[s.sectionBadge, s.sectionBadgeAccepted]}>
                <Text style={[s.sectionBadgeText, s.sectionBadgeTextAccepted]}>
                  6
                </Text>
              </View>
            </View>
            <Pressable style={s.viewAllRow}>
              <Text style={s.viewAll}>View all</Text>
              <View style={s.viewAllChevron}>
                <ChevronRight size={14} color="#138A8A" />
              </View>
            </Pressable>
          </View>

          <View style={s.listCard}>
            {ACCEPTED_REQUESTS.map((req, i) => (
              <Pressable
                key={req.id}
                style={[
                  s.listRow,
                  i < ACCEPTED_REQUESTS.length - 1 && s.listRowBorder,
                ]}
              >
                <View style={[s.listAvatar, { backgroundColor: req.color }]}>
                  <Text style={s.listAvatarText}>{req.initials}</Text>
                </View>
                <View style={s.listInfo}>
                  <Text style={s.listName}>{req.name}</Text>
                  <Text style={s.listCondition}>{req.condition}</Text>
                  <View style={s.listLocRow}>
                    <View style={s.listLocIcon}>
                      <MapPin size={11} color="#707588" />
                    </View>
                    <Text style={s.listLoc}>{req.location}</Text>
                  </View>
                </View>
                <View style={s.listRight}>
                  <Text style={s.listDate}>{req.date}</Text>
                  <View style={s.acceptedBadge}>
                    <Text style={s.acceptedBadgeText}>Accepted</Text>
                  </View>
                </View>
                <View style={s.listChevron}>
                  <ChevronRight size={16} color="#D1D5DB" />
                </View>
              </Pressable>
            ))}
          </View>

          {/* ── Declined Requests ── */}
          <View style={s.sectionHeaderRow}>
            <View style={s.sectionHeaderLeft}>
              <Text style={s.sectionTitle}>Declined Requests</Text>
              <View style={[s.sectionBadge, s.sectionBadgeDeclined]}>
                <Text style={[s.sectionBadgeText, s.sectionBadgeTextDeclined]}>
                  5
                </Text>
              </View>
            </View>
            <Pressable style={s.viewAllRow}>
              <Text style={s.viewAll}>View all</Text>
              <View style={s.viewAllChevron}>
                <ChevronRight size={14} color="#138A8A" />
              </View>
            </Pressable>
          </View>

          <View style={s.listCard}>
            {DECLINED_REQUESTS.map((req, i) => (
              <Pressable
                key={req.id}
                style={[
                  s.listRow,
                  i < DECLINED_REQUESTS.length - 1 && s.listRowBorder,
                ]}
              >
                <View style={[s.listAvatar, { backgroundColor: req.color }]}>
                  <Text style={[s.listAvatarText, { color: req.textColor }]}>
                    {req.initials}
                  </Text>
                </View>
                <View style={s.listInfo}>
                  <Text style={s.listName}>{req.name}</Text>
                  <Text style={s.listCondition}>{req.condition}</Text>
                  <View style={s.listLocRow}>
                    <View style={s.listLocIcon}>
                      <MapPin size={11} color="#707588" />
                    </View>
                    <Text style={s.listLoc}>{req.location}</Text>
                  </View>
                </View>
                <View style={s.listRight}>
                  <Text style={s.listDate}>{req.date}</Text>
                  <View style={s.declinedBadge}>
                    <Text style={s.declinedBadgeText}>Declined</Text>
                  </View>
                </View>
                <View style={s.listChevron}>
                  <ChevronRight size={16} color="#D1D5DB" />
                </View>
              </Pressable>
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
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#0B2545" },
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

  // Filter tabs
  filterTabsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  filterTabsScroll: { paddingHorizontal: 10, gap: 6 },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  filterTabActive: { backgroundColor: "#F0FAF9" },
  filterTabText: { fontSize: 13, fontWeight: "600", color: "#707588" },
  filterTabTextActive: { color: "#138A8A", fontWeight: "800" },
  filterTabBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  filterTabBadgeActive: { backgroundColor: "#138A8A" },
  filterTabBadgeText: { fontSize: 11, fontWeight: "800", color: "#707588" },
  filterTabBadgeTextActive: { color: "#fff" },

  // Search
  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#EAECEF",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchIcon: { alignItems: "center", justifyContent: "center" },
  searchInput: { flex: 1, fontSize: 14, color: "#0B2545" },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#EAECEF",
  },
  filterBtnIcon: { alignItems: "center", justifyContent: "center" },
  filterBtnText: { fontSize: 13, fontWeight: "700", color: "#707588" },

  // Section headers
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#0B2545" },
  sectionBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#138A8A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  sectionBadgeAccepted: { backgroundColor: "#E6F4F4" },
  sectionBadgeDeclined: { backgroundColor: "#FEE2E2" },
  sectionBadgeText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  sectionBadgeTextAccepted: { color: "#138A8A" },
  sectionBadgeTextDeclined: { color: "#E53E3E" },
  viewAllRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAll: { fontSize: 13, fontWeight: "700", color: "#138A8A" },
  viewAllChevron: { alignItems: "center", justifyContent: "center" },

  // New request card
  newRequestCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  newRequestTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  newAvatarWrap: { position: "relative", flexShrink: 0 },
  newAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  newAvatarText: { fontSize: 18, fontWeight: "800" },
  newOnlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },
  newInfo: { flex: 1 },
  newName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0B2545",
    marginBottom: 2,
  },
  newCondition: { fontSize: 13, color: "#707588", marginBottom: 5 },
  newLocRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  newLocIcon: { alignItems: "center", justifyContent: "center" },
  newLoc: { fontSize: 12, color: "#707588" },
  newRight: { alignItems: "flex-end", gap: 6 },
  newTime: { fontSize: 12, color: "#9CA3AF" },
  newBadge: {
    backgroundColor: "#E6F4F4",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  newBadgeText: { fontSize: 11, fontWeight: "700", color: "#138A8A" },
  newRequestBtns: { flexDirection: "row", gap: 10 },
  declineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E53E3E",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  declineBtnText: { fontSize: 14, fontWeight: "700", color: "#E53E3E" },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#138A8A",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  acceptBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  // List card
  listCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 10,
  },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  listAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  listAvatarText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  listInfo: { flex: 1 },
  listName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0B2545",
    marginBottom: 2,
  },
  listCondition: { fontSize: 12, color: "#707588", marginBottom: 4 },
  listLocRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  listLocIcon: { alignItems: "center", justifyContent: "center" },
  listLoc: { fontSize: 11, color: "#707588" },
  listRight: { alignItems: "flex-end", gap: 6 },
  listDate: { fontSize: 11, color: "#9CA3AF" },
  listChevron: { alignItems: "center", justifyContent: "center" },

  // Accepted badge
  acceptedBadge: {
    backgroundColor: "#E6F4F4",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  acceptedBadgeText: { fontSize: 11, fontWeight: "700", color: "#138A8A" },

  // Declined badge
  declinedBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  declinedBadgeText: { fontSize: 11, fontWeight: "700", color: "#E53E3E" },
});
