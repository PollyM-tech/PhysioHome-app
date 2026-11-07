import { useEffect } from "react";
import { router } from "expo-router";
import { AppState } from "react-native";
import * as Device from "expo-device";
import { getProfile, setPush } from "@/lib/marketplace/patient";
import Constants from "expo-constants";
export default function PushRouter() {
  useEffect(() => {
    if (Constants.executionEnvironment === "storeClient") return;
    let alive = true,
      remove: (() => void) | undefined;
    let renewing = false;
    let renew: () => Promise<void> = async () => {};
    const resume = AppState.addEventListener("change", (state) => {
      if (state === "active") void renew();
    });
    void import("expo-notifications")
      .then(async (N) => {
        if (!alive) return;
        const handle = () => {
          if (alive) router.push("/patient/notifications");
        };
        const subscription = N.addNotificationResponseReceivedListener(handle);
        remove = () => subscription.remove();
        renew = async () => {
          if (renewing || !alive || !Device.isDevice) return;
          const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ||
            Constants.easConfig?.projectId;
          if (!projectId) return;
          renewing = true;
          try {
            const profile = await getProfile();
            const permission = await N.getPermissionsAsync();
            if (!alive || !profile.profile.push_enabled || !permission.granted)
              return;
            const token = await N.getExpoPushTokenAsync({ projectId });
            if (alive) await setPush(true, token.data);
          } catch {
            /* Keep the in-app inbox available and allow explicit registration to retry. */
          } finally {
            renewing = false;
          }
        };
        void renew();
        const last = await N.getLastNotificationResponseAsync();
        if (last && alive) {
          handle();
          await N.clearLastNotificationResponseAsync();
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
      remove?.();
      resume.remove();
    };
  }, []);
  return null;
}
