import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import {
  Menu,
  Bell,
  CalendarDays,
  UserPlus,
  CheckSquare,
  Wallet,
  MapPin,
  ChevronRight,
} from "lucide-react-native";

const COLORS = {
  teal: "#138A8A",
  navy: "#0B2545",
  slate: "#707588",
  muted: "#8A94A6",
  white: "#FFFFFF",
  bg: "#F7F8FA",
  border: "#EAECEF",
  aqua: "#E6F4F4",
  blueSoft: "#EEF6FF",
  greenSoft: "#E8F8EF",
  orangeSoft: "#FFF3DE",
  purpleSoft: "#F3EFFF",
  green: "#22C55E",
  red: "#E53E3E",
};

const overview = [
  {
    icon: <CalendarDays size={20} color="#2563EB" strokeWidth={2.2} />,
    value: "4",
    label: "Upcoming",
    bg: COLORS.blueSoft,
  },
  {
    icon: <UserPlus size={20} color={COLORS.teal} strokeWidth={2.2} />,
    value: "1",
    label: "Requests",
    bg: COLORS.greenSoft,
  },
  {
    icon: <CheckSquare size={20} color="#EA8A10" strokeWidth={2.2} />,
    value: "12",
    label: "Completed",
    bg: COLORS.orangeSoft,
  },
  {
    icon: <Wallet size={20} color="#6D3FD9" strokeWidth={2.2} />,
    value: "KES 8,450",
    label: "Earnings",
    bg: COLORS.purpleSoft,
    small: true,
  },
];

const appointments = [
  {
    time: "10:00",
    period: "AM",
    name: "Pauline N.",
    issue: "Lower Back Pain",
    location: "Westlands, Nairobi",
    initials: "PN",
    status: "Upcoming",
    statusColor: "green",
    timeBg: COLORS.aqua,
  },
  {
    time: "12:30",
    period: "PM",
    name: "Joseph K.",
    issue: "Knee Rehabilitation",
    location: "Kilimani, Nairobi",
    initials: "JK",
    status: "Upcoming",
    statusColor: "blue",
    timeBg: COLORS.blueSoft,
  },
  {
    time: "03:00",
    period: "PM",
    name: "Mary W.",
    issue: "Post Surgery Therapy",
    location: "Lavington, Nairobi",
    initials: "MW",
    status: "Upcoming",
    statusColor: "blue",
    timeBg: "#FFF0F5",
  },
];

export default function PhysioHomeScreen() {
  const [online, setOnline] = useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.phone}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.iconButton}>
              <Menu size={26} color={COLORS.navy} strokeWidth={2.2} />
            </Pressable>

            <View>
              <Text style={styles.headerSub}>Welcome back,</Text>
              <Text style={styles.headerTitle}>Dr. James 👋</Text>
              <Text style={styles.roleText}>Physiotherapist</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable style={styles.bellWrap}>
              <Bell size={24} color={COLORS.navy} strokeWidth={2.1} />
              <View style={styles.notifBadge}>
                <Text style={styles.notifText}>2</Text>
              </View>
            </Pressable>

            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>JM</Text>
              </View>
              <View style={styles.avatarOnline} />
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.onlineCard}>
            <View style={styles.onlineLeft}>
              <View style={styles.onlineIconWrap}>
                <View style={styles.onlineDot} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.onlineTitle}>
                  {online ? "You are Online" : "You are Offline"}
                </Text>
                <Text style={styles.onlineSub}>
                  {online
                    ? "Available for new appointments"
                    : "Not receiving appointment requests"}
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.switchTrack, !online && styles.switchOff]}
              onPress={() => setOnline((prev) => !prev)}
            >
              <View style={styles.switchThumb} />
            </Pressable>
          </View>

          <SectionHeader title="Today’s Overview" rightText="View all" />

          <View style={styles.overviewGrid}>
            {overview.map((item) => (
              <View key={item.label} style={styles.overviewCard}>
                <View
                  style={[styles.overviewIcon, { backgroundColor: item.bg }]}
                >
                  {item.icon}
                </View>
                <Text
                  style={[
                    styles.overviewValue,
                    item.small && styles.overviewValueSmall,
                  ]}
                  numberOfLines={1}
                >
                  {item.value}
                </Text>
                <Text style={styles.overviewLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <SectionHeader title="Upcoming Appointments" rightText="View all" />

          <View style={styles.listCard}>
            {appointments.map((item, index) => (
              <AppointmentCard
                key={item.name}
                item={item}
                last={index === appointments.length - 1}
              />
            ))}
          </View>

          <SectionHeader title="New Requests" rightText="View all" />

          <View style={styles.requestCard}>
            <View style={styles.requestAvatar}>
              <Text style={styles.requestAvatarText}>AK</Text>
            </View>

            <View style={styles.requestInfo}>
              <Text style={styles.requestName}>Alice K.</Text>
              <Text style={styles.requestIssue}>Neck Pain</Text>

              <View style={styles.locationRow}>
                <MapPin size={13} color={COLORS.slate} strokeWidth={2.2} />
                <Text style={styles.locationText}>Kileleshwa, Nairobi</Text>
              </View>
            </View>

            <View style={styles.requestRight}>
              <Text style={styles.requestTime}>Today, 9:20 AM</Text>

              <View style={styles.requestActions}>
                <Pressable style={styles.declineBtn}>
                  <Text style={styles.declineText}>Decline</Text>
                </Pressable>

                <Pressable style={styles.acceptBtn}>
                  <Text style={styles.acceptText}>Accept</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <SectionHeader title="This Week’s Summary" rightText="View Report" />

          <View style={styles.weekCard}>
            <SummaryItem value="18" label="Appointments" />
            <View style={styles.weekDivider} />
            <SummaryItem value="16" label="Completed" />
            <View style={styles.weekDivider} />
            <SummaryItem value="KES 52,300" label="Total Earnings" />
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  rightText,
}: {
  title: string;
  rightText: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <Pressable style={styles.viewAllRow}>
        <Text style={styles.viewAllText}>{rightText}</Text>
        <ChevronRight size={16} color={COLORS.teal} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

function AppointmentCard({
  item,
  last,
}: {
  item: {
    time: string;
    period: string;
    name: string;
    issue: string;
    location: string;
    initials: string;
    status: string;
    statusColor: string;
    timeBg: string;
  };
  last?: boolean;
}) {
  const isGreen = item.statusColor === "green";

  return (
    <Pressable style={[styles.appointmentRow, !last && styles.rowBorder]}>
      <View style={[styles.timeBox, { backgroundColor: item.timeBg }]}>
        <Text style={styles.timeText}>{item.time}</Text>
        <Text style={styles.periodText}>{item.period}</Text>
      </View>

      <View style={styles.patientAvatar}>
        <Text style={styles.patientAvatarText}>{item.initials}</Text>
      </View>

      <View style={styles.appointmentInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientIssue}>{item.issue}</Text>

        <View style={styles.locationRow}>
          <MapPin size={12} color={COLORS.slate} strokeWidth={2.2} />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      </View>

      <View style={styles.appointmentRight}>
        <View
          style={[
            styles.statusPill,
            isGreen ? styles.statusGreen : styles.statusBlue,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              isGreen ? styles.statusTextGreen : styles.statusTextBlue,
            ]}
          >
            {item.status}
          </Text>
        </View>

        <ChevronRight size={18} color={COLORS.navy} strokeWidth={2.2} />
      </View>
    </Pressable>
  );
}

function SummaryItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  phone: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconButton: {
    padding: 4,
  },
  headerSub: {
    fontSize: 14,
    color: COLORS.slate,
    fontWeight: "500",
  },
  headerTitle: {
    marginTop: 1,
    fontSize: 25,
    lineHeight: 30,
    color: COLORS.navy,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  roleText: {
    marginTop: 2,
    fontSize: 14,
    color: COLORS.teal,
    fontWeight: "800",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellWrap: {
    position: "relative",
    padding: 4,
  },
  notifBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.red,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.bg,
  },
  notifText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "900",
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "900",
  },
  avatarOnline: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 14,
  },
  onlineCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D9EFEF",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  onlineLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  onlineIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.greenSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: COLORS.green,
  },
  onlineTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.navy,
  },
  onlineSub: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.slate,
    fontWeight: "500",
  },
  switchTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.teal,
    padding: 3,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  switchOff: {
    backgroundColor: "#CBD5E1",
    alignItems: "flex-start",
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  sectionHeader: {
    marginTop: 2,
    marginBottom: -2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.navy,
  },
  viewAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.teal,
  },
  overviewGrid: {
    flexDirection: "row",
    gap: 10,
  },
  overviewCard: {
    flex: 1,
    minHeight: 104,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  overviewIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  overviewValue: {
    fontSize: 22,
    lineHeight: 25,
    fontWeight: "900",
    color: COLORS.navy,
    textAlign: "center",
  },
  overviewValueSmall: {
    fontSize: 16,
    lineHeight: 20,
  },
  overviewLabel: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.slate,
    textAlign: "center",
    fontWeight: "700",
  },
  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  appointmentRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timeBox: {
    width: 54,
    height: 58,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  timeText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.navy,
  },
  periodText: {
    marginTop: 1,
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.slate,
  },
  patientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.aqua,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  patientAvatarText: {
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.teal,
  },
  appointmentInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.navy,
  },
  patientIssue: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.slate,
  },
  locationRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.slate,
    fontWeight: "500",
  },
  appointmentRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusGreen: {
    backgroundColor: "#DDF7E8",
  },
  statusBlue: {
    backgroundColor: "#EAF3FF",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },
  statusTextGreen: {
    color: "#087F5B",
  },
  statusTextBlue: {
    color: "#2563EB",
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.aqua,
    alignItems: "center",
    justifyContent: "center",
  },
  requestAvatarText: {
    color: COLORS.teal,
    fontSize: 16,
    fontWeight: "900",
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.navy,
  },
  requestIssue: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.slate,
    fontWeight: "600",
  },
  requestRight: {
    alignItems: "flex-end",
    gap: 12,
  },
  requestTime: {
    fontSize: 11,
    color: COLORS.slate,
    fontWeight: "600",
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  declineBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F3A6A6",
    alignItems: "center",
    justifyContent: "center",
  },
  declineText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: "900",
  },
  acceptBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },
  weekCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.navy,
    textAlign: "center",
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.slate,
    textAlign: "center",
  },
  weekDivider: {
    width: 1,
    height: 42,
    backgroundColor: COLORS.border,
  },
});
