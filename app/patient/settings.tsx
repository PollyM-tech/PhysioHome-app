import React from "react";
import { router } from "expo-router";
import { Button, Page } from "@/components/marketplace/Primitives";
export default function SettingsScreen() {
  return (
    <Page backTo="/patient/home" title="Patient menu">
      {(
        [
          ["My Profile", "/patient/profile"],
          ["Bookings", "/patient/bookings"],
          ["Messages", "/patient/messages"],
          ["Saved locations", "/patient/locations"],
          ["Notifications", "/patient/notifications"],
          ["Help & Support", "/patient/support"],
          ["Privacy & Security", "/patient/privacy"],
          ["Payments", "/patient/payments"],
          ["Home", "/patient/home"],
        ] as const
      ).map(([title, path]) => (
        <Button
          key={path}
          title={title}
          secondary
          onPress={() => router.push(path)}
        />
      ))}
    </Page>
  );
}
