import React, { useMemo, useState } from "react";
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
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  ChevronRight,
} from "lucide-react-native";

const COLORS = {
  teal: "#138A8A",
  tealDark: "#0F9A97",
  navy: "#0B2545",
  slate: "#707588",
  white: "#FFFFFF",
  bg: "#F8FAFC",
  border: "#DCE3EC",
  borderSoft: "#E8EEF3",
  textLight: "#8A94A6",
  ruleBg: "#F5FBFB",
  black: "#111827",
};

type InputFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  icon: React.ReactNode;
  secure?: boolean;
  showToggle?: boolean;
  visible?: boolean;
  onToggleVisible?: () => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words";
};

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secure = false,
  showToggle = false,
  visible = false,
  onToggleVisible,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: InputFieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={styles.inputWrapper}>
        <View style={styles.leftIcon}>{icon}</View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          style={styles.input}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secure && !visible}
        />

        {showToggle && (
          <Pressable onPress={onToggleVisible} style={styles.rightIcon}>
            {visible ? (
              <EyeOff size={20} color={COLORS.slate} strokeWidth={2} />
            ) : (
              <Eye size={20} color={COLORS.slate} strokeWidth={2} />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

function PasswordRule({ text, met }: { text: string; met: boolean }) {
  return (
    <View style={styles.ruleRow}>
      <CheckCircle2
        size={16}
        color={COLORS.teal}
        fill={met ? COLORS.teal : "transparent"}
        strokeWidth={2}
      />
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

export default function SignupPatientScreen() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const rules = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );

  const canSubmit =
    fullName.trim().length > 0 &&
    phone.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length > 0 &&
    confirmPassword.trim().length > 0 &&
    password === confirmPassword &&
    rules.length &&
    rules.uppercase &&
    rules.number &&
    rules.special &&
    agreed;

  const handleSignup = () => {
    if (!canSubmit) return;

    // Temporary route while auth backend is not connected.
    router.push("/patient/home" as any);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Back */}
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={30} color={COLORS.navy} strokeWidth={2.3} />
          </Pressable>

          {/* Heading */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>
              Sign up as a patient to get started
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formArea}>
            <InputField
              label="Full Name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              icon={<User size={20} color={COLORS.slate} strokeWidth={2} />}
              autoCapitalize="words"
            />

            <InputField
              label="Phone Number"
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              icon={<Phone size={20} color={COLORS.slate} strokeWidth={2} />}
              keyboardType="phone-pad"
            />

            <InputField
              label="Email Address"
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              icon={<Mail size={20} color={COLORS.slate} strokeWidth={2} />}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <InputField
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              icon={<Lock size={20} color={COLORS.slate} strokeWidth={2} />}
              secure
              showToggle
              visible={showPassword}
              onToggleVisible={() => setShowPassword((prev) => !prev)}
              autoCapitalize="none"
            />

            <InputField
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              icon={<Lock size={20} color={COLORS.slate} strokeWidth={2} />}
              secure
              showToggle
              visible={showConfirmPassword}
              onToggleVisible={() => setShowConfirmPassword((prev) => !prev)}
              autoCapitalize="none"
            />

            {/* Password Rules Box */}
            <View style={styles.rulesCard}>
              <View style={styles.rulesHeader}>
                <Shield size={20} color={COLORS.teal} strokeWidth={2} />
                <Text style={styles.rulesTitle}>Password must contain:</Text>
              </View>

              <View style={styles.rulesList}>
                <PasswordRule text="At least 8 characters" met={rules.length} />
                <PasswordRule
                  text="One uppercase letter"
                  met={rules.uppercase}
                />
                <PasswordRule text="One number" met={rules.number} />
                <PasswordRule
                  text="One special character"
                  met={rules.special}
                />
              </View>
            </View>

            {/* Terms */}
            <Pressable
              style={styles.checkboxRow}
              onPress={() => setAgreed((prev) => !prev)}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && (
                  <CheckCircle2
                    size={13}
                    color={COLORS.white}
                    fill={COLORS.teal}
                    strokeWidth={2.5}
                  />
                )}
              </View>

              <Text style={styles.checkboxText}>
                I agree to the{" "}
                <Text style={styles.linkText}>Terms of Service</Text> and{" "}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </Pressable>

            {/* Primary CTA */}
            <Pressable
              onPress={handleSignup}
              style={[
                styles.primaryButton,
                !canSubmit && styles.primaryButtonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>Sign Up as Patient</Text>
            </Pressable>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <Pressable style={styles.socialButton}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </Pressable>

            {/* Apple */}
            <Pressable style={styles.socialButton}>
              <Text style={styles.appleIcon}></Text>
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </Pressable>
          </View>

          {/* Footer Login */}
          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account?</Text>

            <Pressable
              style={styles.loginAction}
              onPress={() => router.push("/auth/login" as any)}
            >
              <Text style={styles.loginLink}>Log In</Text>
              <ChevronRight size={22} color={COLORS.teal} strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={styles.bottomHandle} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  container: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 22,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  headerBlock: {
    alignItems: "center",
    marginBottom: 22,
  },
  title: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "900",
    color: COLORS.navy,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.slate,
    textAlign: "center",
    fontWeight: "500",
  },

  formArea: {
    width: "100%",
  },

  fieldBlock: {
    marginBottom: 13,
  },
  fieldLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.navy,
    marginBottom: 7,
  },
  inputWrapper: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  leftIcon: {
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.navy,
    fontWeight: "500",
    outlineStyle: "none" as any,
  },
  rightIcon: {
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  rulesCard: {
    borderWidth: 1.1,
    borderColor: "#CAE8E6",
    backgroundColor: COLORS.ruleBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 2,
    marginBottom: 15,
  },
  rulesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  rulesTitle: {
    marginLeft: 9,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.teal,
  },
  rulesList: {
    gap: 7,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ruleText: {
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.black,
    fontWeight: "500",
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.7,
    borderColor: COLORS.teal,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
    marginRight: 11,
  },
  checkboxChecked: {
    backgroundColor: COLORS.teal,
  },
  checkboxText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.navy,
    fontWeight: "500",
  },
  linkText: {
    color: COLORS.teal,
    fontWeight: "700",
  },

  primaryButton: {
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.teal,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
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

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1.1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: COLORS.slate,
    fontWeight: "500",
  },

  socialButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  socialButtonText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    color: COLORS.navy,
  },
  googleIcon: {
    fontSize: 24,
    fontWeight: "900",
    color: "#EA4335",
    marginRight: 14,
  },
  appleIcon: {
    fontSize: 26,
    color: "#000000",
    marginRight: 14,
    lineHeight: 28,
  },

  loginRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginPrompt: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.slate,
    fontWeight: "500",
  },
  loginAction: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 9,
  },
  loginLink: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.teal,
    fontWeight: "900",
    marginRight: 4,
  },

  bottomHandle: {
    alignSelf: "center",
    marginTop: 22,
    width: 96,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#000000",
  },
});
