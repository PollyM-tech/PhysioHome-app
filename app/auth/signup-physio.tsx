import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Modal,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  BadgeCheck,
  BriefcaseMedical,
  CalendarDays,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronDown,
  AlertCircle,
  Shield,
  ChevronRight,
} from "lucide-react-native";

const COLORS = {
  teal: "#138A8A",
  navy: "#0B2545",
  slate: "#707588",
  white: "#FFFFFF",
  bg: "#FFFFFF",
  border: "#DCE3EC",
  textLight: "#8A94A6",
  aqua: "#E6F4F4",
  ruleBg: "#F5FBFB",
  warningBg: "#FFF9EC",
  warningBorder: "#FDE68A",
  error: "#E53E3E",
  black: "#111827",
};

const SPECIALTIES = [
  "Spine & Back Therapy",
  "Sports Injury & Rehabilitation",
  "Knee & Joint Therapy",
  "Neurological Rehabilitation",
  "Elderly & Mobility Care",
  "Post-Surgery Recovery",
  "Pediatric Physiotherapy",
  "Women's Health Physiotherapy",
  "Cardiopulmonary Rehabilitation",
  "General Physiotherapy",
];

const EXPERIENCE_OPTIONS = [
  "Less than 1 year",
  "1 - 2 years",
  "3 - 5 years",
  "6 - 10 years",
  "10+ years",
];

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
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  highlight?: boolean;
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
  highlight = false,
}: InputFieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={[styles.inputWrapper, highlight && styles.inputHighlight]}>
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

function DropdownField({
  label,
  placeholder,
  value,
  options,
  onSelect,
  icon,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  icon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <Pressable style={styles.inputWrapper} onPress={() => setOpen(true)}>
        <View style={styles.leftIcon}>{icon}</View>

        <Text
          style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}
        >
          {value || placeholder}
        </Text>

        <ChevronDown size={20} color={COLORS.slate} strokeWidth={2} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalCard}>
            <Text style={styles.modalTitle}>{label}</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const selected = option === value;

                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.modalOption,
                      selected && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      onSelect(option);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        selected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>

                    {selected && (
                      <CheckCircle2
                        size={18}
                        color={COLORS.teal}
                        fill={COLORS.teal}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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

export default function SignupPhysioScreen() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experience, setExperience] = useState("");
  const [serviceArea, setServiceArea] = useState("");
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

  const passwordIsValid =
    rules.length && rules.uppercase && rules.number && rules.special;

  const passwordsDoNotMatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmit =
    fullName.trim().length > 0 &&
    phone.trim().length > 0 &&
    email.trim().length > 0 &&
    licenseNumber.trim().length > 0 &&
    specialty.trim().length > 0 &&
    experience.trim().length > 0 &&
    serviceArea.trim().length > 0 &&
    passwordIsValid &&
    confirmPassword.length > 0 &&
    password === confirmPassword &&
    agreed;

  const handleSignup = () => {
    if (!canSubmit) return;

    router.push("/auth/verification-pending" as any);
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
              Sign up as a physiotherapist to get started
            </Text>
          </View>

          {/* License Notice */}
          <View style={styles.licenseBanner}>
            <AlertCircle
              size={20}
              color={COLORS.teal}
              strokeWidth={2}
              style={{ marginTop: 1 }}
            />
            <Text style={styles.licenseBannerText}>
              A valid Kenya Physiotherapists Council license number is required
              before your profile can receive bookings.
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
              label="License / Registration Number"
              placeholder="KPC/YYYY/XXXXX"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              icon={
                <BadgeCheck size={20} color={COLORS.teal} strokeWidth={2} />
              }
              autoCapitalize="characters"
              highlight
            />

            <Text style={styles.licenseHint}>
              Example: KPC/2025/12345 — issued by Kenya Physiotherapists Council
            </Text>

            <DropdownField
              label="Specialty"
              placeholder="Select your specialty"
              value={specialty}
              options={SPECIALTIES}
              onSelect={setSpecialty}
              icon={
                <BriefcaseMedical
                  size={20}
                  color={COLORS.slate}
                  strokeWidth={2}
                />
              }
            />

            <DropdownField
              label="Years of Experience"
              placeholder="Select your experience"
              value={experience}
              options={EXPERIENCE_OPTIONS}
              onSelect={setExperience}
              icon={
                <CalendarDays size={20} color={COLORS.slate} strokeWidth={2} />
              }
            />

            <InputField
              label="Service Area / Location"
              placeholder="Enter your service area"
              value={serviceArea}
              onChangeText={setServiceArea}
              icon={<MapPin size={20} color={COLORS.slate} strokeWidth={2} />}
              autoCapitalize="words"
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

            {passwordsDoNotMatch && (
              <Text style={styles.errorText}>Passwords do not match</Text>
            )}

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

            {/* Submit */}
            <Pressable
              onPress={handleSignup}
              disabled={!canSubmit}
              style={[
                styles.primaryButton,
                !canSubmit && styles.primaryButtonDisabled,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                Sign Up as Physiotherapist
              </Text>
            </Pressable>

            {/* Verification note */}
            <View style={styles.verificationNote}>
              <AlertCircle
                size={16}
                color={COLORS.slate}
                strokeWidth={2}
                style={{ marginTop: 1 }}
              />
              <Text style={styles.verificationNoteText}>
                After signup, your license will be reviewed within 24–48 hours
                before your profile goes live.
              </Text>
            </View>
          </View>

          {/* Footer Login */}
          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account?</Text>

            <Pressable
              style={styles.loginAction}
              onPress={() => router.push("/auth/login-physio" as any)}
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
    marginBottom: 18,
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

  licenseBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1.1,
    borderColor: "#CAE8E6",
    backgroundColor: COLORS.ruleBg,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  licenseBannerText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.navy,
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
  inputHighlight: {
    borderColor: COLORS.teal,
    backgroundColor: "#F8FEFD",
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

  dropdownText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: COLORS.navy,
    fontWeight: "500",
  },
  dropdownPlaceholder: {
    color: COLORS.textLight,
  },

  licenseHint: {
    marginTop: -7,
    marginBottom: 13,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.slate,
    fontWeight: "500",
  },

  errorText: {
    marginTop: -8,
    marginBottom: 10,
    fontSize: 12,
    color: COLORS.error,
    fontWeight: "600",
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
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: COLORS.teal,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 14,
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
    textAlign: "center",
  },

  verificationNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.warningBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.warningBorder,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 4,
  },
  verificationNoteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.slate,
    fontWeight: "500",
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(11,37,69,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    width: "100%",
    maxHeight: "65%",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.navy,
    textAlign: "center",
    marginBottom: 12,
  },
  modalOption: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  modalOptionSelected: {
    backgroundColor: "#F5FBFB",
  },
  modalOptionText: {
    fontSize: 15,
    color: COLORS.navy,
    fontWeight: "500",
  },
  modalOptionTextSelected: {
    color: COLORS.teal,
    fontWeight: "800",
  },
});
