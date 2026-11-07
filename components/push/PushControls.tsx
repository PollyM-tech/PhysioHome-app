import React, { useState } from "react";
import { Text, Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Button, ErrorMessage } from "@/components/marketplace/Primitives";
import { setPush } from "@/lib/marketplace/patient";
export default function PushControls({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const toggle = async () => {
    setError("");
    setBusy(true);
    try {
      if (!Device.isDevice || Constants.executionEnvironment === "storeClient")
        throw new Error(
          "Push notifications need a physical phone and a development or production build.",
        );
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;
      if (!projectId)
        throw new Error(
          "The app needs its EAS project configured before push can be enabled.",
        );
      const Notifications = await import("expo-notifications");
      if (Platform.OS === "android")
        await Notifications.setNotificationChannelAsync("appointments", {
          name: "Appointments",
          importance: Notifications.AndroidImportance.HIGH,
        });
      let permission = await Notifications.getPermissionsAsync();
      if (!permission.granted)
        permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted)
        throw new Error(
          "Notifications are not allowed. You can enable them in your phone settings.",
        );
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      await setPush(true, token.data);
      onChange(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to update push preferences.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Text>
        Phone notifications: {enabled ? "Enabled" : "Disabled"}. You can always
        read updates inside the app. Register this phone again after changing
        devices.
      </Text>
      <ErrorMessage message={error} />
      <Button
        title={
          enabled
            ? "Register this phone for notifications"
            : "Enable phone notifications"
        }
        disabled={busy}
        onPress={() => void toggle()}
      />
      {enabled ? (
        <Button
          title="Disable phone notifications on all devices"
          secondary
          disabled={busy}
          onPress={() => {
            setBusy(true);
            setError("");
            void setPush(false)
              .then(() => onChange(false))
              .catch((e) => setError(e.message))
              .finally(() => setBusy(false));
          }}
        />
      ) : null}
    </>
  );
}
