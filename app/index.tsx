import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth/context";
import { accountDestination } from "@/lib/auth/client";

export default function Index() {
  const { user } = useAuth();
  return <Redirect href={user ? accountDestination(user) : "/onboarding"} />;
}
