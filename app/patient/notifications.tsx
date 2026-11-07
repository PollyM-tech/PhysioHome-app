import PushControls from "@/components/push/PushControls";
import { getProfile } from "@/lib/marketplace/patient";
import React, { useCallback, useState } from "react";
import { AppState, Text } from "react-native";
import { router, useFocusEffect } from "expo-router";
import {
  Button,
  Card,
  ErrorMessage,
  Page,
} from "@/components/marketplace/Primitives";
import {
  listNotifications,
  markNotificationsRead,
  PatientNotification,
} from "@/lib/marketplace/api";

export default function NotificationsScreen() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [items, setItems] = useState<PatientNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const data = await listNotifications();
    setItems(data.notifications);
    setUnread(data.unread_count);
    setError("");
    setLoading(false);
  }, []);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      let running = false;
      const refresh = async () => {
        if (
          running ||
          AppState.currentState === "background" ||
          AppState.currentState === "inactive"
        )
          return;
        running = true;
        try {
          const data = await listNotifications();
          if (active) {
            setItems(data.notifications);
            setUnread(data.unread_count);
            setError("");
          }
        } catch (err) {
          if (active)
            setError(
              err instanceof Error
                ? err.message
                : "Unable to load notifications.",
            );
        } finally {
          running = false;
          if (active) setLoading(false);
        }
      };
      void getProfile()
        .then((d) => {
          if (active) setPushEnabled(d.profile.push_enabled);
        })
        .catch(() => {});
      void refresh();
      const timer = setInterval(() => void refresh(), 15000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, []),
  );
  const read = async (id?: number) => {
    setBusy(true);
    setError("");
    try {
      await markNotificationsRead(id);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not mark notification read.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Page backTo="/patient/settings" title="Notifications">
      <Card>
        <PushControls enabled={pushEnabled} onChange={setPushEnabled} />
      </Card>
      <ErrorMessage message={error} />
      <Button
        secondary
        title="Refresh notifications"
        disabled={busy}
        onPress={() => {
          void load().catch((err) => setError(err.message));
        }}
      />
      {unread > 0 ? (
        <Button
          title="Mark all as read"
          disabled={busy}
          onPress={() => void read()}
        />
      ) : null}
      {loading ? (
        <Text>Loading notifications…</Text>
      ) : !items.length ? (
        <Card>
          <Text>
            No notifications yet. Your booking updates will appear here as they
            happen.
          </Text>
        </Card>
      ) : null}
      {items.map((item) => (
        <Card key={item.id}>
          <Text
            style={{
              fontSize: 18,
              color: "#0B2545",
              fontWeight: item.read_at ? "500" : "800",
            }}
          >
            {item.title}
          </Text>
          <Text style={{ fontSize: 16 }}>{item.body}</Text>
          <Text style={{ color: "#707588" }}>
            {new Date(item.created_at).toLocaleString()}
          </Text>
          {!item.read_at ? (
            <Button
              secondary
              title="Mark as read"
              disabled={busy}
              onPress={() => void read(item.id)}
            />
          ) : (
            <Text>Read</Text>
          )}
        </Card>
      ))}
      <Button
        secondary
        title="View your bookings"
        onPress={() => router.push("/patient/bookings")}
      />
    </Page>
  );
}
