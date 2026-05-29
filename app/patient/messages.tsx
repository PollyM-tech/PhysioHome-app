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
  MessageCircle,
  CalendarDays,
  Megaphone,
  Paperclip,
  Pencil,
  Users,
  MoreHorizontal,
  Headphones,
} from "lucide-react-native";

// ─── Static Data ─────────────────────────────────────────────────
const ACTIVE_CONTACTS = [
  {
    id: "1",
    name: "Dr. James",
    initials: "JM",
    color: "#138A8A",
    online: true,
  },
  {
    id: "2",
    name: "Dr. Grace",
    initials: "GA",
    color: "#087F83",
    online: true,
    active: true,
  },
  {
    id: "3",
    name: "Dr. Samuel",
    initials: "SO",
    color: "#5FA7A7",
    online: false,
  },
  {
    id: "4",
    name: "Support",
    initials: "SP",
    color: "#E6F4F4",
    isSupport: true,
    online: true,
  },
  { id: "5", name: "More", initials: "...", color: "#F3F4F6", isMore: true },
];

const CHATS = [
  {
    id: "1",
    name: "Dr. James Mwangi",
    initials: "JM",
    color: "#138A8A",
    message:
      "Great progress! Keep up with your exercises. See you in our next session.",
    time: "10:30 AM",
    unread: 2,
    online: true,
  },
  {
    id: "2",
    name: "Dr. Grace Achieng'",
    initials: "GA",
    color: "#087F83",
    message: "Don't forget to do your neck stretches twice daily.",
    time: "Yesterday",
    unread: 1,
    online: true,
  },
  {
    id: "3",
    name: "PhysioHome Support",
    initials: "PS",
    color: "#E6F4F4",
    isSupport: true,
    message: "Your appointment with Dr. Samuel has been confirmed.",
    time: "Mon",
    unread: 0,
    online: true,
  },
  {
    id: "4",
    name: "Dr. Samuel Otieno",
    initials: "SO",
    color: "#5FA7A7",
    message:
      "Please share a video of the new exercises so I can review your form.",
    time: "2 May",
    unread: 0,
    hasAttachment: true,
    online: false,
  },
  {
    id: "5",
    name: "Care Team Updates",
    initials: "CT",
    color: "#E6F4F4",
    isGroup: true,
    message:
      "Reminder: Stay hydrated and follow your recovery plan consistently.",
    time: "30 Apr",
    unread: 0,
    online: false,
  },
];

const TABS = ["Chats", "Appointments", "Announcements"];

// ─── Avatar Component ─────────────────────────────────────────────
function Avatar({
  initials,
  color,
  size = 54,
  isSupport = false,
  isGroup = false,
  isMore = false,
  online = false,
  active = false,
}: {
  initials: string;
  color: string;
  size?: number;
  isSupport?: boolean;
  isGroup?: boolean;
  isMore?: boolean;
  online?: boolean;
  active?: boolean;
}) {
  const isLight = color === "#E6F4F4" || color === "#F3F4F6";
  return (
    <View style={{ position: "relative" }}>
      <View
        style={[
          av.wrap,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            borderWidth: active ? 2.5 : 0,
            borderColor: active ? "#138A8A" : "transparent",
          },
        ]}
      >
        {isSupport ? (
          <Headphones size={size * 0.4} color="#138A8A" />
        ) : isGroup ? (
          <Users size={size * 0.4} color="#138A8A" />
        ) : isMore ? (
          <MoreHorizontal size={size * 0.4} color="#9CA3AF" />
        ) : (
          <Text
            style={[
              av.initials,
              { fontSize: size * 0.3, color: isLight ? "#138A8A" : "#fff" },
            ]}
          >
            {initials}
          </Text>
        )}
      </View>
      {online && (
        <View
          style={[
            av.onlineDot,
            {
              width: size * 0.22,
              height: size * 0.22,
              borderRadius: (size * 0.22) / 2,
              bottom: 1,
              right: 1,
            },
          ]}
        />
      )}
    </View>
  );
}

const av = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  initials: { fontWeight: "800" },
  onlineDot: {
    position: "absolute",
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function MessagesScreen() {
  const [activeTab, setActiveTab] = useState("Chats");

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
              <Text style={s.headerTitle}>Messages</Text>
              <Text style={s.headerSub}>Connect with your physiotherapist</Text>
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
              placeholder="Search messages, therapists..."
              placeholderTextColor="#9CA3AF"
            />
            <Pressable style={s.filterBtn}>
              <SlidersHorizontal size={18} color="#707588" />
            </Pressable>
          </View>

          {/* Active contacts strip */}
          <View style={s.contactsCard}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.contactsScroll}
            >
              {ACTIVE_CONTACTS.map((c) => (
                <Pressable key={c.id} style={s.contactItem}>
                  <Avatar
                    initials={c.initials}
                    color={c.color}
                    size={62}
                    isSupport={c.isSupport}
                    isMore={c.isMore}
                    online={c.online}
                    active={c.active}
                  />
                  <Text style={s.contactName}>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Tabs */}
          <View style={s.tabsRow}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              const TabIcon =
                tab === "Chats"
                  ? MessageCircle
                  : tab === "Appointments"
                    ? CalendarDays
                    : Megaphone;
              return (
                <Pressable
                  key={tab}
                  style={[s.tabBtn, isActive && s.tabBtnActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <TabIcon size={15} color={isActive ? "#fff" : "#707588"} />
                  <Text style={[s.tabText, isActive && s.tabTextActive]}>
                    {tab}
                  </Text>
                  {tab === "Chats" && (
                    <View
                      style={[
                        s.tabBadge,
                        isActive ? s.tabBadgeActive : s.tabBadgeInactive,
                      ]}
                    >
                      <Text
                        style={[
                          s.tabBadgeText,
                          !isActive && s.tabBadgeTextInactive,
                        ]}
                      >
                        3
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Chat list */}
          <View style={s.chatList}>
            {CHATS.map((chat, i) => (
              <Pressable
                key={chat.id}
                style={[s.chatRow, i < CHATS.length - 1 && s.chatRowBorder]}
              >
                {/* Avatar */}
                <Avatar
                  initials={chat.initials}
                  color={chat.color}
                  size={56}
                  isSupport={chat.isSupport}
                  isGroup={chat.isGroup}
                  online={chat.online}
                />

                {/* Content */}
                <View style={s.chatContent}>
                  <View style={s.chatTopRow}>
                    <Text style={s.chatName}>{chat.name}</Text>
                    <Text style={s.chatTime}>{chat.time}</Text>
                  </View>
                  <View style={s.chatBottomRow}>
                    <Text style={s.chatMsg} numberOfLines={2}>
                      {chat.message}
                    </Text>
                    <View style={s.chatRight}>
                      {chat.unread > 0 && (
                        <View style={s.unreadBadge}>
                          <Text style={s.unreadText}>{chat.unread}</Text>
                        </View>
                      )}
                      {chat.hasAttachment && (
                        <Paperclip size={16} color="#9CA3AF" />
                      )}
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating compose button */}
        <Pressable style={s.fab}>
          <Pencil size={22} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
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
    backgroundColor: "#F7F8FA",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#0B2545" },
  headerSub: { fontSize: 13, color: "#707588", marginTop: 1 },
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
  scrollContent: { paddingHorizontal: 16, gap: 14 },

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

  // Contacts strip
  contactsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  contactsScroll: { paddingHorizontal: 14, gap: 18 },
  contactItem: { alignItems: "center", gap: 8 },
  contactName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0B2545",
    textAlign: "center",
  },

  // Tabs
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 5,
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnActive: { backgroundColor: "#138A8A" },
  tabText: { fontSize: 13, fontWeight: "700", color: "#707588" },
  tabTextActive: { color: "#fff" },
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabBadgeActive: { backgroundColor: "#fff" },
  tabBadgeInactive: { backgroundColor: "#E53E3E" },
  tabBadgeText: { fontSize: 11, fontWeight: "800", color: "#138A8A" },
  tabBadgeTextInactive: { color: "#fff" },

  // Chat list
  chatList: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  chatRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  chatContent: { flex: 1 },
  chatTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: { fontSize: 15, fontWeight: "800", color: "#0B2545" },
  chatTime: { fontSize: 12, color: "#9CA3AF" },
  chatBottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  chatMsg: {
    fontSize: 13,
    color: "#707588",
    lineHeight: 19,
    flex: 1,
    marginRight: 8,
  },
  chatRight: { alignItems: "flex-end" },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E53E3E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#138A8A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#138A8A",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
