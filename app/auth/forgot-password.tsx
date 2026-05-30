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
import { router } from "expo-router";
import {
  ArrowLeft,
  Mail,
  Send,
  CheckCircle2,
  ShieldCheck,
  Clock,
  ChevronRight,
  RotateCcw,
} from "lucide-react-native";

const COLORS = {
  teal: "#138A8A",
  navy: "#0B2545",
  slate: "#707588",
  white: "#FFFFFF",
  bg: "#F8FAFC",
  border: "#DCE3EC",
  aqua: "#E6F4F4",
  textLight: "#8A94A6",
  warningBg: "#FFF9EC",
  warningBorder: "#FDE68A",
  orange: "#F59E0B",
};

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);

  const canSend = email.trim().length > 0 && email.includes("@");

  const handleSendResetLink = () => {
    if (!canSend) return;

    // Later this will call the real auth provider:
    // await sendPasswordResetEmail(email.trim());
    setLinkSent(true);
  };

  const handleResend = () => {
    if (!canSend) return;

    // Later this will resend the real reset email.
    setLinkSent(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={28} color={COLORS.navy} strokeWidth={2.3} />
          </Pressable>

          <View style={styles.topSpacer} />

          {!linkSent ? (
            <>
              <View style={styles.iconWrap}>
                <View style={styles.iconCircle}>
                  <Mail size={38} color={COLORS.teal} strokeWidth={2.2} />
                </View>
              </View>

              <View style={styles.headingSection}>
                <Text style={styles.heading}>Forgot Password?</Text>
                <Text style={styles.subheading}>
                  Enter the email linked to your PhysioHome account and we’ll
                  send you a secure reset link.
                </Text>
              </View>

              <View style={styles.formSection}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email Address</Text>

                  <View style={styles.inputWrap}>
                    <Mail size={19} color={COLORS.slate} strokeWidth={2} />

                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email address"
                      placeholderTextColor={COLORS.textLight}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <Text style={styles.helperText}>
                    We will send a password reset link to this email.
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.primaryButton,
                    !canSend && styles.primaryButtonDisabled,
                  ]}
                  disabled={!canSend}
                  onPress={handleSendResetLink}
                >
                  <Text style={styles.primaryButtonText}>Send Reset Link</Text>
                  <Send size={20} color={COLORS.white} strokeWidth={2.4} />
                </Pressable>

                <View style={styles.noticeBox}>
                  <ShieldCheck
                    size={18}
                    color={COLORS.teal}
                    strokeWidth={2.2}
                    style={{ marginTop: 1 }}
                  />

                  <Text style={styles.noticeText}>
                    For your security, the reset link will expire after a short
                    time. Use the latest link sent to your email.
                  </Text>
                </View>
              </View>

              <View style={styles.flexPush} />

              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>Remember your password?</Text>

                <Pressable
                  style={styles.loginAction}
                  onPress={() => router.push("/auth/login-patient" as any)}
                >
                  <Text style={styles.loginLink}>Log In</Text>
                  <ChevronRight
                    size={20}
                    color={COLORS.teal}
                    strokeWidth={2.5}
                  />
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.successIconWrap}>
                <View style={styles.successIconCircle}>
                  <CheckCircle2
                    size={52}
                    color={COLORS.white}
                    fill={COLORS.teal}
                    strokeWidth={2.2}
                  />
                </View>
              </View>

              <View style={styles.headingSection}>
                <Text style={styles.heading}>Check Your Email</Text>
                <Text style={styles.subheading}>
                  We sent a password reset link to:
                </Text>

                <View style={styles.emailPill}>
                  <Mail size={16} color={COLORS.teal} strokeWidth={2.2} />
                  <Text style={styles.emailPillText}>{email.trim()}</Text>
                </View>
              </View>

              <View style={styles.stepsCard}>
                <Text style={styles.stepsTitle}>Next steps</Text>

                <StepItem
                  icon={
                    <Mail size={18} color={COLORS.teal} strokeWidth={2.2} />
                  }
                  title="Open your email"
                  text="Look for an email from PhysioHome with your password reset link."
                />

                <StepItem
                  icon={
                    <ShieldCheck
                      size={18}
                      color={COLORS.teal}
                      strokeWidth={2.2}
                    />
                  }
                  title="Reset your password"
                  text="Tap the secure link and create a new password for your account."
                />

                <StepItem
                  icon={
                    <Clock size={18} color={COLORS.orange} strokeWidth={2.2} />
                  }
                  title="Use the latest link"
                  text="If you request another reset email, only use the most recent link."
                  isLast
                />
              </View>

              <View style={styles.warningBox}>
                <Clock
                  size={18}
                  color={COLORS.orange}
                  strokeWidth={2.2}
                  style={{ marginTop: 1 }}
                />

                <Text style={styles.warningText}>
                  The reset link will expire after a short time for your account
                  security.
                </Text>
              </View>

              <View style={styles.actionStack}>
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => router.push("/auth/login-patient" as any)}
                >
                  <Text style={styles.primaryButtonText}>Back to Login</Text>
                  <ChevronRight
                    size={20}
                    color={COLORS.white}
                    strokeWidth={2.4}
                  />
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setLinkSent(false)}
                >
                  <Mail size={19} color={COLORS.teal} strokeWidth={2.2} />
                  <Text style={styles.secondaryButtonText}>
                    Use Different Email
                  </Text>
                </Pressable>

                <Pressable style={styles.resendButton} onPress={handleResend}>
                  <RotateCcw size={17} color={COLORS.slate} strokeWidth={2.2} />
                  <Text style={styles.resendText}>Resend Reset Link</Text>
                </Pressable>
              </View>
            </>
          )}

          <View style={styles.homeIndicatorWrap}>
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StepItem({
  icon,
  title,
  text,
  isLast = false,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.stepRow, isLast && styles.stepRowLast]}>
      <View style={styles.stepIcon}>{icon}</View>

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
    paddingTop: 14,
    paddingBottom: 18,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },

  topSpacer: {
    height: 34,
  },

  iconWrap: {
    alignSelf: "center",
    marginBottom: 18,
  },
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.aqua,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBE8E8",
  },

  successIconWrap: {
    alignSelf: "center",
    marginTop: 18,
    marginBottom: 20,
  },
  successIconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: COLORS.aqua,
  },

  headingSection: {
    marginBottom: 22,
    alignItems: "center",
  },
  heading: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "900",
    color: COLORS.navy,
    marginBottom: 7,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.slate,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 335,
  },

  formSection: {
    width: "100%",
  },

  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.navy,
    marginBottom: 7,
  },
  inputWrap: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 11,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.navy,
    fontWeight: "500",
    outlineStyle: "none" as any,
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.slate,
    fontWeight: "500",
  },

  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },

  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.aqua,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBE8E8",
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginTop: 2,
  },
  noticeText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.slate,
    fontWeight: "500",
  },

  flexPush: {
    flex: 1,
    minHeight: 40,
  },

  loginRow: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: COLORS.aqua,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  loginPrompt: {
    fontSize: 15,
    color: COLORS.slate,
    fontWeight: "500",
  },
  loginAction: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.teal,
    marginRight: 2,
  },

  emailPill: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.aqua,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#CBE8E8",
  },
  emailPillText: {
    marginLeft: 7,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.teal,
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
  stepsTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: COLORS.navy,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 16,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  stepRowLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
  },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.aqua,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepTextBox: {
    flex: 1,
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
    color: COLORS.slate,
    fontWeight: "500",
  },

  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.warningBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 18,
  },
  warningText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.slate,
    fontWeight: "500",
  },

  actionStack: {
    width: "100%",
  },
  secondaryButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: COLORS.teal,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  secondaryButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.teal,
  },
  resendButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    marginBottom: 20,
  },
  resendText: {
    marginLeft: 7,
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.slate,
  },

  homeIndicatorWrap: {
    alignItems: "center",
    paddingBottom: 4,
  },
  homeIndicator: {
    width: 120,
    height: 5,
    borderRadius: 999,
    backgroundColor: COLORS.navy,
  },
});
