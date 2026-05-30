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
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react-native";

const COLORS = {
  teal: "#138A8A",
  navy: "#0B2545",
  slate: "#707588",
  white: "#FFFFFF",
  bg: "#F8FAFC",
  border: "#DCE3EC",
  lightBorder: "#E8EEF3",
  textLight: "#8A94A6",
  aqua: "#E6F4F4",
};

export default function LoginPatientScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const canLogin = identifier.trim().length > 0 && password.trim().length > 0;

  const handleLogin = () => {
    if (!canLogin) return;

    // Temporary route until real auth is connected.
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
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={28} color={COLORS.navy} strokeWidth={2.3} />
          </Pressable>

          {/* Top spacer to make login sit around half page */}
          <View style={styles.topSpacer} />

          {/* Heading */}
          <View style={styles.headingSection}>
            <Text style={styles.heading}>Welcome Back</Text>
            <Text style={styles.subheading}>
              Log in to your account to continue
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {/* Email or Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email or Phone Number</Text>

              <View style={styles.inputWrap}>
                <Mail size={19} color={COLORS.slate} strokeWidth={2} />

                <TextInput
                  style={styles.input}
                  placeholder="Enter email or phone number"
                  placeholderTextColor={COLORS.textLight}
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>

              <View style={styles.inputWrap}>
                <Lock size={19} color={COLORS.slate} strokeWidth={2} />

                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textLight}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />

                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff size={19} color={COLORS.slate} strokeWidth={2} />
                  ) : (
                    <Eye size={19} color={COLORS.slate} strokeWidth={2} />
                  )}
                </Pressable>
              </View>

              <Pressable
                style={styles.forgotRow}
                onPress={() => router.push("/auth/forgot-password" as any)}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>

            {/* Log In button */}
            <Pressable
              style={[
                styles.loginButton,
                !canLogin && styles.loginButtonDisabled,
              ]}
              disabled={!canLogin}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
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

          {/* Push footer lower */}
          <View style={styles.flexPush} />

          {/* Sign up row */}
          <View style={styles.signupBanner}>
            <Text style={styles.signupText}>{"Don't have an account? "}</Text>

            <Pressable
              style={styles.signupLinkRow}
              onPress={() => router.push("/auth/choose-role" as any)}
            >
              <Text style={styles.signupLink}>Sign Up</Text>
              <ChevronRight size={18} color={COLORS.teal} strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Home indicator */}
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
    height: 42,
  },

  headingSection: {
    marginBottom: 26,
  },
  heading: {
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "900",
    color: COLORS.navy,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.slate,
    fontWeight: "500",
  },

  formSection: {
    width: "100%",
  },

  fieldGroup: {
    marginBottom: 14,
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
  eyeButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  forgotRow: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  forgotText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
    color: COLORS.teal,
  },

  loginButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.55,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "900",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1.1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: COLORS.slate,
    fontWeight: "500",
  },

  socialButton: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },
  googleIcon: {
    fontSize: 23,
    fontWeight: "900",
    color: "#EA4335",
    marginRight: 13,
  },
  appleIcon: {
    fontSize: 25,
    color: "#000000",
    marginRight: 13,
    lineHeight: 27,
  },
  socialButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: COLORS.navy,
  },

  flexPush: {
    flex: 1,
    minHeight: 30,
  },

  signupBanner: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.aqua,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  signupText: {
    fontSize: 15,
    color: COLORS.slate,
    fontWeight: "500",
  },
  signupLinkRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  signupLink: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.teal,
    marginRight: 2,
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
