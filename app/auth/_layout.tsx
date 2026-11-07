import {
  Redirect,
  Stack,
  useSegments,
  useGlobalSearchParams,
} from "expo-router";
import { useAuth } from "@/lib/auth/context";
import { accountDestination } from "@/lib/auth/client";

export default function AuthLayout() {
  const { user } = useAuth();
  const segments = useSegments();
  const { intent } = useGlobalSearchParams<{ intent?: string }>();
  const pendingPage = segments.some(
    (segment) => segment === "verification-pending",
  );
  if (
    user &&
    (!pendingPage || accountDestination(user) !== "/auth/verification-pending")
  )
    return (
      <Redirect
        href={
          user.role === "patient" &&
          (intent === "automatic" || intent === "choose")
            ? {
                pathname: "/patient/bookings",
                params: { mode: intent, service: "" },
              }
            : accountDestination(user)
        }
      />
    );
  if (!user && pendingPage) return <Redirect href="/auth/login-physio" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
