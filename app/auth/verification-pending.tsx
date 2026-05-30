import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import {
  BadgeCheck,
  Clock,
  FileCheck2,
  MailCheck,
  ShieldCheck,
  ArrowRight,
  Home,
  LogIn,
} from "lucide-react-native";

const COLORS = {
  teal: "#138A8A",
  tealDark: "#087F83",
  navy: "#0B2545",
  slate: "#707588",
  white: "#FFFFFF",
  bg: "#F8FAFC",
  border: "#DCE3EC",
  aqua: "#E6F4F4",
  cream: "#F6ECDD",
  warningBg: "#FFF9EC",
  warningBorder: "#FDE68A",
  orange: "#F59E0B",
  green: "#22C55E",
};

export default function VerificationPendingScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Main success icon */}
          <View style={styles.heroIconWrap}>
            <View style={styles.heroIconCircle}>
              <BadgeCheck size={52} color={COLORS.teal} strokeWidth={2.2} />
            </View>

            <View style={styles.clockBadge}>
              <Clock size={18} color={COLORS.white} strokeWidth={2.4} />
            </View>
          </View>

          {/* Heading */}
          <View style={styles.headingBlock}>
            <Text style={styles.title}>Verification Pending</Text>
            <Text style={styles.subtitle}>
              Your physiotherapist account has been submitted for review.
            </Text>
          </View>

          {/* Status card */}
          <View style={styles.statusCard}>
            <View style={styles.statusTopRow}>
              <View style={styles.statusIconBox}>
                <ShieldCheck size={24} color={COLORS.teal} strokeWidth={2.2} />
              </View>

              <View style={styles.statusTextBox}>
                <Text style={styles.statusTitle}>
                  License Review in Progress
                </Text>
                <Text style={styles.statusText}>
                  Our team will verify your professional license and profile
                  details before your account is activated.
                </Text>
              </View>
            </View>

            <View style={styles.statusPill}>
              <Clock size={16} color={COLORS.orange} strokeWidth={2.2} />
              <Text style={styles.statusPillText}>
                Usually completed in 24–48 hours
              </Text>
            </View>
          </View>

          {/* What happens next */}
          <View style={styles.stepsCard}>
            <Text style={styles.sectionTitle}>What happens next?</Text>

            <StepItem
              number="1"
              icon={<FileCheck2 size={20} color={COLORS.teal} />}
              title="We review your details"
              text="Your license number, specialty, and submitted information will be checked."
            />

            <StepItem
              number="2"
              icon={<ShieldCheck size={20} color={COLORS.teal} />}
              title="Your profile gets approved"
              text="Once verified, your profile can appear in patient search results."
            />

            <StepItem
              number="3"
              icon={<MailCheck size={20} color={COLORS.teal} />}
              title="You receive a notification"
              text="We will notify you when your account is approved and ready to receive bookings."
              isLast
            />
          </View>

          {/* Important note */}
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Important</Text>
            <Text style={styles.noteText}>
              You can log in while your account is under review, but booking
              requests will only be enabled after verification is approved.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/auth/login-physio" as any)}
            >
              <Text style={styles.primaryButtonText}>Go to Login</Text>
              <ArrowRight size={22} color={COLORS.white} strokeWidth={2.4} />
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push("/onboarding" as any)}
            >
              <Home size={20} color={COLORS.teal} strokeWidth={2.3} />
              <Text style={styles.secondaryButtonText}>Back to Home</Text>
            </Pressable>

            <Pressable
              style={styles.linkButton}
              onPress={() => router.push("/auth/login-patient" as any)}
            >
              <LogIn size={18} color={COLORS.slate} strokeWidth={2.2} />
              <Text style={styles.linkButtonText}>
                Log in as Patient instead
              </Text>
            </Pressable>
          </View>

          <View style={styles.homeIndicator} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StepItem({
  number,
  icon,
  title,
  text,
  isLast = false,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  isLast?: boolean;
}) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepLeft}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{number}</Text>
        </View>

        {!isLast && <View style={styles.stepLine} />}
      </View>

      <View style={styles.stepIconBox}>{icon}</View>

      <View style={styles.stepTextBox}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  container: {
    width: "100%",
    maxWidth: 430,
    minHeight: "100%",
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 22,
  },

  heroIconWrap: {
    alignSelf: "center",
    position: "relative",
    marginTop: 18,
    marginBottom: 22,
  },
  heroIconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: COLORS.aqua,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.4,
    borderColor: "#BFE8E5",
  },
  clockBadge: {
    position: "absolute",
    right: 2,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.orange,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.bg,
  },

  headingBlock: {
    alignItems: "center",
    marginBottom: 22,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    color: COLORS.navy,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 23,
    color: COLORS.slate,
    textAlign: "center",
    fontWeight: "500",
    maxWidth: 330,
  },

  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  statusTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  statusIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.aqua,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statusTextBox: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
    color: COLORS.navy,
    marginBottom: 5,
  },
  statusText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
    color: COLORS.slate,
  },
  statusPill: {
    marginTop: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.warningBg,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusPillText: {
    marginLeft: 7,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    color: "#B45309",
  },

  stepsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: COLORS.navy,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 82,
  },
  stepLeft: {
    alignItems: "center",
    marginRight: 10,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#DDEEEE",
    marginTop: 4,
  },
  stepIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.aqua,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  stepTextBox: {
    flex: 1,
    paddingBottom: 18,
  },
  stepTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: COLORS.navy,
    marginBottom: 3,
  },
  stepText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    color: COLORS.slate,
  },

  noteCard: {
    backgroundColor: COLORS.warningBg,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 18,
  },
  noteTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: COLORS.navy,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.slate,
    fontWeight: "500",
  },

  actions: {
    width: "100%",
  },
  primaryButton: {
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
    marginRight: 8,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1.2,
    borderColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: COLORS.teal,
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 8,
  },
  linkButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    marginBottom: 20,
  },
  linkButtonText: {
    color: COLORS.slate,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },

  homeIndicator: {
    alignSelf: "center",
    width: 120,
    height: 5,
    borderRadius: 999,
    backgroundColor: COLORS.navy,
    marginTop: 4,
  },
});
