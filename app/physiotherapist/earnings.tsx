import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  Menu,
  Bell,
  ChevronDown,
  ChevronRight,
  Wallet,
  CalendarDays,
  User,
  Star,
  ArrowDownToLine,
  FileText,
  Gift,
  SlidersHorizontal,
} from "lucide-react-native";

// ─── Static Data ──────────────────────────────────────────────────
const TABS = ["Overview", "Transactions", "Payouts", "Invoices"];

const STATS = [
  {
    icon: <Wallet size={22} color="#138A8A" />,
    iconBg: "#E6F4F4",
    label: "Total Earnings",
    value: "KES 52,300",
    growth: "12%",
    vs: "vs Apr 1 – Apr 30",
  },
  {
    icon: <CalendarDays size={22} color="#3B82F6" />,
    iconBg: "#EEF2FF",
    label: "Completed Sessions",
    value: "18",
    growth: "5%",
    vs: "vs Apr 1 – Apr 30",
  },
  {
    icon: <User size={22} color="#8B5CF6" />,
    iconBg: "#F5F3FF",
    label: "Clients Served",
    value: "16",
    growth: "7%",
    vs: "vs Apr 1 – Apr 30",
  },
  {
    icon: <Star size={22} color="#F59E0B" />,
    iconBg: "#FFFBEB",
    label: "Avg. Per Session",
    value: "KES 2,906",
    growth: "8%",
    vs: "vs Apr 1 – Apr 30",
  },
];

const CHART_DATA = [
  { week: "Apr 29 – May 5", value: 32400, label: "KES 32,400" },
  { week: "May 6 – May 12", value: 41200, label: "KES 41,200" },
  { week: "May 13 – May 19", value: 48600, label: "KES 48,600" },
  { week: "May 20 – May 26", value: 45300, label: "KES 45,300" },
  { week: "May 27 – May 31", value: 52300, label: "KES 52,300" },
];

const TRANSACTIONS = [
  {
    id: "1",
    title: "Session with Pauline N.",
    date: "May 31, 2024",
    time: "10:00 AM",
    amount: "+KES 2,500",
    status: "Completed",
    type: "income",
    icon: <ArrowDownToLine size={18} color="#138A8A" />,
    iconBg: "#E6F4F4",
  },
  {
    id: "2",
    title: "Session with Joseph K.",
    date: "May 30, 2024",
    time: "12:30 PM",
    amount: "+KES 2,000",
    status: "Completed",
    type: "income",
    icon: <ArrowDownToLine size={18} color="#138A8A" />,
    iconBg: "#E6F4F4",
  },
  {
    id: "3",
    title: "Session with Mary W.",
    date: "May 29, 2024",
    time: "03:00 PM",
    amount: "+KES 2,200",
    status: "Completed",
    type: "income",
    icon: <ArrowDownToLine size={18} color="#138A8A" />,
    iconBg: "#E6F4F4",
  },
  {
    id: "4",
    title: "Withdrawal to Bank **** 4567",
    date: "May 28, 2024",
    time: "09:15 AM",
    amount: "-KES 20,000",
    status: "Processed",
    type: "withdrawal",
    icon: <FileText size={18} color="#F59E0B" />,
    iconBg: "#FFFBEB",
  },
];

// ─── Mini Line Chart ──────────────────────────────────────────────
function EarningsChart() {
  const maxValue = Math.max(...CHART_DATA.map((d) => d.value));
  const chartHeight = 160;
  const chartWidth = 280;
  const pointCount = CHART_DATA.length;

  const getX = (i: number) => (i / (pointCount - 1)) * chartWidth;
  const getY = (val: number) =>
    chartHeight - (val / maxValue) * chartHeight * 0.85;

  const yLabels = [0, 10, 20, 30, 40, 50, 60];

  return (
    <View style={ch.wrap}>
      {/* Y axis labels */}
      <View style={ch.yAxis}>
        {yLabels
          .slice()
          .reverse()
          .map((label) => (
            <Text key={label} style={ch.yLabel}>
              {label}K
            </Text>
          ))}
      </View>

      {/* Chart area */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={[ch.chartArea, { width: chartWidth + 40 }]}>
          {/* Grid lines */}
          {yLabels.map((_, i) => (
            <View
              key={i}
              style={[
                ch.gridLine,
                { top: (i / (yLabels.length - 1)) * chartHeight },
              ]}
            />
          ))}

          {/* Area fill using Views */}
          {CHART_DATA.map((point, i) => {
            if (i === CHART_DATA.length - 1) return null;
            const x1 = getX(i) + 20;
            const y1 = getY(point.value);
            const x2 = getX(i + 1) + 20;
            const y2 = getY(CHART_DATA[i + 1].value);
            const width = Math.sqrt(
              Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2),
            );
            const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
            return (
              <View
                key={i}
                style={[
                  ch.line,
                  {
                    left: x1,
                    top: y1,
                    width,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              />
            );
          })}

          {/* Data points + labels */}
          {CHART_DATA.map((point, i) => {
            const x = getX(i) + 20;
            const y = getY(point.value);
            return (
              <View key={i}>
                {/* Label */}
                <View
                  style={[
                    ch.labelWrap,
                    {
                      left: x - 35,
                      top: y - 26,
                    },
                  ]}
                >
                  <Text style={ch.pointLabel}>{point.label}</Text>
                </View>
                {/* Dot */}
                <View style={[ch.dot, { left: x - 6, top: y - 6 }]} />
              </View>
            );
          })}

          {/* X axis labels */}
          <View style={[ch.xAxisRow, { top: chartHeight + 10 }]}>
            {CHART_DATA.map((point, i) => (
              <View
                key={i}
                style={[ch.xLabelWrap, { left: getX(i) + 20 - 38 }]}
              >
                <Text style={ch.xLabel}>{point.week}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const ch = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    height: 220,
    marginTop: 8,
  },
  yAxis: {
    width: 36,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 6,
    paddingBottom: 30,
  },
  yLabel: { fontSize: 10, color: "#9CA3AF" },
  chartArea: {
    height: 200,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 20,
    right: 0,
    height: 1,
    backgroundColor: "#F0F1F3",
  },
  line: {
    position: "absolute",
    height: 2.5,
    backgroundColor: "#138A8A",
    borderRadius: 2,
    transformOrigin: "left center",
  },
  dot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#138A8A",
    borderWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#138A8A",
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  labelWrap: {
    position: "absolute",
    width: 80,
    alignItems: "center",
  },
  pointLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#0B2545",
    textAlign: "center",
  },
  xAxisRow: { position: "absolute", left: 0, right: 0 },
  xLabelWrap: { position: "absolute", width: 76, alignItems: "center" },
  xLabel: {
    fontSize: 9,
    color: "#9CA3AF",
    textAlign: "center",
  },
});

// ─── Main Screen ──────────────────────────────────────────────────
export default function EarningsScreen() {
  const [activeTab, setActiveTab] = useState("Overview");

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
              <Text style={s.headerTitle}>Earnings</Text>
              <Text style={s.headerSub}>Track your income and growth</Text>
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
          {/* Tabs */}
          <View style={s.tabsRow}>
            {TABS.map((tab) => (
              <Pressable
                key={tab}
                style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Period selector */}
          <View style={s.periodCard}>
            <View>
              <Pressable style={s.periodSelector}>
                <Text style={s.periodTitle}>This Month</Text>
                <View style={s.periodChevron}>
                  <ChevronDown size={16} color="#0B2545" />
                </View>
              </Pressable>
              <Text style={s.periodDate}>May 1 – May 31, 2024</Text>
            </View>
            <Pressable style={s.filterBtn}>
              <View style={s.filterIcon}>
                <SlidersHorizontal size={16} color="#138A8A" />
              </View>
              <Text style={s.filterText}>Filter</Text>
            </Pressable>
          </View>

          {/* Stats grid */}
          <View style={s.statsGrid}>
            {STATS.map((stat, i) => (
              <View key={i} style={s.statCard}>
                <View
                  style={[s.statIconWrap, { backgroundColor: stat.iconBg }]}
                >
                  {stat.icon}
                </View>
                <Text style={s.statLabel}>{stat.label}</Text>
                <Text style={s.statValue}>{stat.value}</Text>
                <View style={s.statGrowthRow}>
                  <Text style={s.statGrowthArrow}>↑</Text>
                  <Text style={s.statGrowth}>{stat.growth}</Text>
                </View>
                <Text style={s.statVs}>{stat.vs}</Text>
              </View>
            ))}
          </View>

          {/* Earnings Trend */}
          <View style={s.chartCard}>
            <View style={s.chartHeader}>
              <Text style={s.chartTitle}>Earnings Trend</Text>
              <Pressable style={s.weekSelector}>
                <Text style={s.weekText}>By Week</Text>
                <View style={s.weekChevron}>
                  <ChevronDown size={14} color="#0B2545" />
                </View>
              </Pressable>
            </View>
            <EarningsChart />
          </View>

          {/* Recent Transactions */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent Transactions</Text>
            <Pressable style={s.viewAllRow}>
              <Text style={s.viewAll}>View all</Text>
              <View style={s.viewAllChevron}>
                <ChevronRight size={14} color="#138A8A" />
              </View>
            </Pressable>
          </View>

          <View style={s.transactionsCard}>
            {TRANSACTIONS.map((tx, i) => (
              <View
                key={tx.id}
                style={[s.txRow, i < TRANSACTIONS.length - 1 && s.txRowBorder]}
              >
                <View style={[s.txIconWrap, { backgroundColor: tx.iconBg }]}>
                  {tx.icon}
                </View>
                <View style={s.txInfo}>
                  <Text style={s.txTitle}>{tx.title}</Text>
                  <Text style={s.txDate}>
                    {tx.date} • {tx.time}
                  </Text>
                </View>
                <View style={s.txRight}>
                  <Text
                    style={[
                      s.txAmount,
                      tx.type === "withdrawal" ? s.txAmountNeg : s.txAmountPos,
                    ]}
                  >
                    {tx.amount}
                  </Text>
                  <View
                    style={[
                      s.txStatusBadge,
                      tx.type === "withdrawal"
                        ? s.txStatusWithdrawal
                        : s.txStatusCompleted,
                    ]}
                  >
                    <Text
                      style={[
                        s.txStatusText,
                        tx.type === "withdrawal"
                          ? s.txStatusTextWithdrawal
                          : s.txStatusTextCompleted,
                      ]}
                    >
                      {tx.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Motivation card */}
          <Pressable style={s.motivationCard}>
            <View style={s.motivationIconWrap}>
              <Gift size={26} color="#138A8A" />
            </View>
            <View style={s.motivationText}>
              <Text style={s.motivationTitle}>{"Keep it up, Dr. James!"}</Text>
              <Text style={s.motivationSub}>
                {"You're doing great. Your earnings are up 12% this month."}
              </Text>
            </View>
            <View style={s.motivationChevron}>
              <ChevronRight size={20} color="#9CA3AF" />
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

  // Tabs
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 4,
    gap: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#138A8A",
  },
  tabText: { fontSize: 13, fontWeight: "600", color: "#707588" },
  tabTextActive: { color: "#138A8A", fontWeight: "800" },

  // Period card
  periodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  periodSelector: { flexDirection: "row", alignItems: "center", gap: 6 },
  periodTitle: { fontSize: 16, fontWeight: "800", color: "#0B2545" },
  periodChevron: { alignItems: "center", justifyContent: "center" },
  periodDate: { fontSize: 12, color: "#707588", marginTop: 3 },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#138A8A",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterIcon: { alignItems: "center", justifyContent: "center" },
  filterText: { fontSize: 13, fontWeight: "700", color: "#138A8A" },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statCard: {
    width: "47%",
    gap: 4,
  },
  statIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: "#707588", fontWeight: "500" },
  statValue: { fontSize: 20, fontWeight: "900", color: "#0B2545" },
  statGrowthRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  statGrowthArrow: { fontSize: 12, color: "#22C55E", fontWeight: "800" },
  statGrowth: { fontSize: 12, fontWeight: "700", color: "#22C55E" },
  statVs: { fontSize: 11, color: "#9CA3AF" },

  // Chart
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chartTitle: { fontSize: 16, fontWeight: "800", color: "#0B2545" },
  weekSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  weekText: { fontSize: 13, fontWeight: "600", color: "#0B2545" },
  weekChevron: { alignItems: "center", justifyContent: "center" },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#0B2545" },
  viewAllRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAll: { fontSize: 13, fontWeight: "700", color: "#138A8A" },
  viewAllChevron: { alignItems: "center", justifyContent: "center" },

  // Transactions
  transactionsCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  txRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  txIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  txInfo: { flex: 1 },
  txTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0B2545",
    marginBottom: 3,
  },
  txDate: { fontSize: 12, color: "#9CA3AF" },
  txRight: { alignItems: "flex-end", gap: 6 },
  txAmount: { fontSize: 14, fontWeight: "800" },
  txAmountPos: { color: "#138A8A" },
  txAmountNeg: { color: "#E53E3E" },
  txStatusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  txStatusCompleted: {
    borderColor: "#D1FAE5",
    backgroundColor: "#F0FDF4",
  },
  txStatusWithdrawal: {
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  txStatusText: { fontSize: 11, fontWeight: "700" },
  txStatusTextCompleted: { color: "#059669" },
  txStatusTextWithdrawal: { color: "#D97706" },

  // Motivation
  motivationCard: {
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
  motivationIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#E6F4F4",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  motivationText: { flex: 1 },
  motivationTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0B2545",
    marginBottom: 4,
  },
  motivationSub: { fontSize: 13, color: "#707588", lineHeight: 19 },
  motivationChevron: { alignItems: "center", justifyContent: "center" },
});
