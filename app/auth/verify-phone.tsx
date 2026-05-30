import React, { useRef, useState } from "react";
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
  Phone,
  ShieldCheck,
  MessageCircle,
  Clock,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
} from "lucide-react-native";

const COLORS = {
  teal: "#138A8A",
  navy: "#0B2545",
  slate: "#707588",
  white: "#FFFFFF",
  bg: "#F8FAFC",
  border: "#DCE3EC",
  aqua: "#E6F4F4",
  warningBg: "#FFF9EC",
  warningBorder: "#FDE68A",
  orange: "#F59E0B",
  green: "#22C55E",
  error: "#E53E3E",
};

const OTP_LENGTH = 6;

export default function VerifyPhoneScreen() {
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  const inputs = useRef<Array<TextInput | null>>([]);

  const otpValue = code.join("");
  const canVerify = otpValue.length === OTP_LENGTH;
  const maskedPhone = "+254 7•• ••• •••";

  const handleChange = (value: string, index: number) => {
    setError("");

    const cleaned = value.replace(/[^0-9]/g, "");

    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, OTP_LENGTH).split("");
      const nextCode = Array(OTP_LENGTH).fill("");

      pasted.forEach((digit, i) => {
        nextCode[i] = digit;
      });

      setCode(nextCode);

      const nextFocusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputs.current[nextFocusIndex]?.focus();
      return;
    }

    const nextCode = [...code];
    nextCode[index] = cleaned;
    setCode(nextCode);

    if (cleaned && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    if (!canVerify) return;

    setVerified(true);

    setTimeout(() => {
      router.push("/patient/home" as any);
    }, 700);
  };

  const handleResend = () => {
    setError("");
    setCode(Array(OTP_LENGTH).fill(""));
    inputs.current[0]?.focus();
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

          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              {verified ? (
                <CheckCircle2
                  size={42}
                  color={COLORS.green}
                  fill={COLORS.green}
                  strokeWidth={2.2}
                />
              ) : (
                <Phone size={38} color={COLORS.teal} strokeWidth={2.2} />
              )}
            </View>

            <View style={styles.messageBadge}>
              <MessageCircle size={16} color={COLORS.white} strokeWidth={2.4} />
            </View>
          </View>

          <View style={styles.headingSection}>
            <Text style={styles.heading}>
              {verified ? "Phone Verified" : "Verify Phone Number"}
            </Text>

            <Text style={styles.subheading}>
              {verified
                ? "Your phone number has been verified successfully."
                : "Enter the 6-digit code we sent to your phone number."}
            </Text>

            {!verified && (
              <View style={styles.phonePill}>
                <Phone size={15} color={COLORS.teal} strokeWidth={2.2} />
                <Text style={styles.phonePillText}>{maskedPhone}</Text>
              </View>
            )}
          </View>

          {!verified && (
            <>
              <View style={styles.otpCard}>
                <Text style={styles.otpLabel}>Verification Code</Text>

                <View style={styles.otpRow}>
                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputs.current[index] = ref;
                      }}
                      value={digit}
                      onChangeText={(value) => handleChange(value, index)}
                      onKeyPress={({ nativeEvent }) =>
                        handleKeyPress(nativeEvent.key, index)
                      }
                      keyboardType="number-pad"
                      maxLength={1}
                      style={[
                        styles.otpBox,
                        digit && styles.otpBoxFilled,
                        error && styles.otpBoxError,
                      ]}
                      textAlign="center"
                    />
                  ))}
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.helperBox}>
                  <ShieldCheck
                    size={18}
                    color={COLORS.teal}
                    strokeWidth={2.2}
                    style={{ marginTop: 1 }}
                  />
                  <Text style={styles.helperText}>
                    This helps keep your account secure and confirms your phone
                    number for booking updates.
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.primaryButton,
                    !canVerify && styles.primaryButtonDisabled,
                  ]}
                  disabled={!canVerify}
                  onPress={handleVerify}
                >
                  <Text style={styles.primaryButtonText}>Verify Number</Text>
                  <ChevronRight
                    size={20}
                    color={COLORS.white}
                    strokeWidth={2.4}
                  />
                </Pressable>
              </View>

              <View style={styles.resendCard}>
                <Clock size={18} color={COLORS.orange} strokeWidth={2.2} />

                <Text style={styles.resendPrompt}>
                  Didn’t receive the code?
                </Text>

                <Pressable style={styles.resendButton} onPress={handleResend}>
                  <RotateCcw size={16} color={COLORS.teal} strokeWidth={2.2} />
                  <Text style={styles.resendText}>Resend Code</Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.changeNumberButton}
                onPress={() => router.back()}
              >
                <Text style={styles.changeNumberText}>Change phone number</Text>
              </Pressable>
            </>
          )}

          {verified && (
            <View style={styles.successCard}>
              <CheckCircle2
                size={26}
                color={COLORS.green}
                fill={COLORS.green}
                strokeWidth={2.2}
              />

              <View style={styles.successTextBox}>
                <Text style={styles.successTitle}>Redirecting...</Text>
                <Text style={styles.successText}>
                  We are taking you to your patient dashboard.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.flexPush} />

          <View style={styles.homeIndicatorWrap}>
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    position: "relative",
    marginBottom: 18,
  },
  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.aqua,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#CBE8E8",
  },
  messageBadge: {
    position: "absolute",
    right: -1,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },

  headingSection: {
    alignItems: "center",
    marginBottom: 22,
  },
  heading: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "900",
    color: COLORS.navy,
    textAlign: "center",
    letterSpacing: -0.3,
    marginBottom: 7,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.slate,
    fontWeight: "500",
    textAlign: "center",
    maxWidth: 335,
  },
  phonePill: {
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
  phonePillText: {
    marginLeft: 7,
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.teal,
  },

  otpCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 14,
    overflow: "hidden",
  },
  otpLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
    color: COLORS.navy,
    marginBottom: 12,
  },

  // fixed-width boxes, no flex stretching
  otpRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginBottom: 12,
    width: "100%",
  },
  otpBox: {
    width: 42,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.4,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    fontSize: 19,
    fontWeight: "900",
    color: COLORS.navy,
    outlineStyle: "none" as any,
  },
  otpBoxFilled: {
    borderColor: COLORS.teal,
    backgroundColor: "#F8FEFD",
  },
  otpBoxError: {
    borderColor: COLORS.error,
    backgroundColor: "#FFF5F5",
  },

  errorText: {
    marginBottom: 10,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.error,
    fontWeight: "700",
  },

  helperBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.aqua,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBE8E8",
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 14,
  },
  helperText: {
    flex: 1,
    marginLeft: 9,
    fontSize: 12,
    lineHeight: 18,
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

  resendCard: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: COLORS.warningBg,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  resendPrompt: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.slate,
    fontWeight: "600",
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendText: {
    marginLeft: 5,
    fontSize: 13,
    color: COLORS.teal,
    fontWeight: "900",
  },

  changeNumberButton: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  changeNumberText: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.teal,
  },

  successCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    padding: 16,
  },
  successTextBox: {
    flex: 1,
    marginLeft: 12,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.navy,
    marginBottom: 4,
  },
  successText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.slate,
    fontWeight: "500",
  },

  flexPush: {
    flex: 1,
    minHeight: 30,
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
