import React, { useCallback, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Bell } from "lucide-react-native";
import { listNotifications } from "@/lib/marketplace/api";

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      let running = false;
      const load = async () => {
        if (
          running ||
          AppState.currentState === "background" ||
          AppState.currentState === "inactive"
        )
          return;
        running = true;
        try {
          const data = await listNotifications();
          if (active) setUnread(data.unread_count);
        } catch {
          /* The inbox shows retryable fetch errors when opened. */
        } finally {
          running = false;
        }
      };
      void load();
      const timer = setInterval(() => void load(), 15000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, []),
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        unread ? `Notifications, ${unread} unread` : "Notifications"
      }
      onPress={() => router.push("/patient/notifications")}
      style={{ padding: 10, position: "relative" }}
    >
      <Bell size={24} color="#0B2545" />
      {unread > 0 ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: "#EF4444",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontSize: 11, fontWeight: "700" }}>
            {unread > 99 ? "99+" : unread}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
