import { Redirect } from "expo-router";
import React from "react";
import { accountDestination } from "@/lib/auth/client";
import { useAuth } from "@/lib/auth/context";

export function RoleGuard({
  role,
  children,
}: {
  role: "patient" | "physiotherapist";
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!user)
    return (
      <Redirect
        href={role === "patient" ? "/auth/login-patient" : "/auth/login-physio"}
      />
    );
  if (
    user.role !== role ||
    (role === "physiotherapist" && user.verification_status !== "approved")
  )
    return <Redirect href={accountDestination(user)} />;
  return <>{children}</>;
}
