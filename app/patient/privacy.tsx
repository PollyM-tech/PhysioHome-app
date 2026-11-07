import React, { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth/context";
import Field from "@/components/forms/Field";
import {
  Button,
  Card,
  ErrorMessage,
  Page,
} from "@/components/marketplace/Primitives";
import { changePassword } from "@/lib/marketplace/patient";
export default function PrivacyScreen() {
  const { signOut } = useAuth();
  const [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const save = async () => {
    if (next !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await changePassword(current, next);
      await signOut();
      router.replace("/auth/login-patient");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to change password.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page backTo="/patient/settings" title="Privacy & Security">
      <ErrorMessage message={error} />
      <Card>
        <Text>
          Your exact visit pin and contact details are shared with your assigned
          physiotherapist after acceptance and while the appointment is active.
          Booking conversations and attachments can be accessed only by their
          participants. Phone push notifications use generic text.
        </Text>
        <Text>
          This screen explains the current app behavior. A published privacy
          policy and retention rules still need to be supplied before launch.
        </Text>
      </Card>
      <Card>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>Change password</Text>
        <Text>Changing your password signs out all sessions.</Text>
        <Field
          label="Current password"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
          maxLength={128}
        />
        <Field
          label="New password"
          value={next}
          onChangeText={setNext}
          secureTextEntry
          maxLength={128}
        />
        <Field
          label="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          maxLength={128}
        />
        <Button
          title={busy ? "Updating…" : "Update password"}
          disabled={busy || !current || !next || !confirm}
          onPress={() => void save()}
        />
      </Card>
    </Page>
  );
}
