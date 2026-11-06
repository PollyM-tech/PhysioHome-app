import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function VerifyPhoneScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
        gap: 20,
        backgroundColor: "white",
      }}
    >
      <Text style={{ fontSize: 24, color: "#0B2545", fontWeight: "700" }}>
        Phone verification is not available yet
      </Text>
      <Text style={{ fontSize: 16, color: "#0B2545" }}>
        SMS verification has not been enabled. Your account phone number is not
        marked as verified.
      </Text>
      <Link
        href="/auth/login-patient"
        style={{ paddingVertical: 16, color: "#087F83" }}
      >
        Return to sign in
      </Link>
    </View>
  );
}
