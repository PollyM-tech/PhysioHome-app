import React, { useCallback, useState } from "react";
import { Text } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/auth/context";
import {
  Button,
  Card,
  ErrorMessage,
  Page,
} from "@/components/marketplace/Primitives";
import Field from "@/components/forms/Field";
import { getProfile, Profile, saveProfile } from "@/lib/marketplace/patient";

export default function PatientProfileScreen() {
  const { refreshUser, signOut } = useAuth();
  const [data, setData] = useState<Profile | null>(null),
    [edit, setEdit] = useState(false),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getProfile()
        .then((x) => {
          if (active) setData(x);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
      return () => {
        active = false;
      };
    }, []),
  );
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const save = () =>
    run(async () => {
      if (!data) return;
      const { push_enabled, ...profile } = data.profile;
      void push_enabled;
      const result = await saveProfile({
        ...profile,
        full_name: data.account.full_name,
        email: data.account.email,
        phone: data.account.phone,
        current_password: password,
      });
      setData(result);
      setPassword("");
      setEdit(false);
      await refreshUser();
      setNotice("Profile saved.");
    });
  return (
    <Page title="My Profile">
      <ErrorMessage message={error} />
      {notice ? <Text accessibilityLiveRegion="polite">{notice}</Text> : null}
      {!data ? (
        <Text>Loading your profile…</Text>
      ) : (
        <>
          <Card>
            <Text style={{ fontSize: 23, fontWeight: "700" }}>
              {data.account.full_name}
            </Text>
            <Text>{data.account.email}</Text>
            <Text>{data.account.phone || "No phone number provided"}</Text>
            <Text>
              {data.counts.active} active bookings · {data.counts.completed}{" "}
              completed sessions · {data.counts.locations} saved locations
            </Text>
            <Button
              title={edit ? "Close profile editor" : "Edit Profile"}
              secondary
              disabled={busy}
              onPress={() => {
                if (edit) {
                  void run(async () => {
                    setData(await getProfile());
                    setEdit(false);
                    setPassword("");
                  });
                } else {
                  setEdit(true);
                  setPassword("");
                  setNotice("");
                }
              }}
            />
          </Card>
          {edit ? (
            <Card>
              {(["full_name", "email", "phone"] as const).map((key) => (
                <Field
                  key={key}
                  label={
                    {
                      full_name: "Full name",
                      email: "Email",
                      phone: "Phone number",
                    }[key]
                  }
                  value={data.account[key]}
                  maxLength={key === "full_name" ? 200 : 254}
                  autoCapitalize={key === "full_name" ? "words" : "none"}
                  keyboardType={
                    key === "email"
                      ? "email-address"
                      : key === "phone"
                        ? "phone-pad"
                        : "default"
                  }
                  onChangeText={(text) =>
                    setData({
                      ...data,
                      account: { ...data.account, [key]: text },
                    })
                  }
                />
              ))}
              {(
                [
                  {
                    key: "date_of_birth",
                    label: "Date of birth (YYYY-MM-DD)",
                    max: 10,
                  },
                  { key: "gender", label: "Gender (optional)", max: 40 },
                  { key: "mobility_needs", label: "Mobility needs", max: 500 },
                  {
                    key: "communication",
                    label: "Preferred communication",
                    max: 100,
                  },
                  {
                    key: "care_notes",
                    label: "Care needs or notes",
                    max: 1000,
                  },
                  {
                    key: "emergency_name",
                    label: "Emergency contact name",
                    max: 200,
                  },
                  {
                    key: "emergency_relationship",
                    label: "Emergency contact relationship",
                    max: 100,
                  },
                  {
                    key: "emergency_phone",
                    label: "Emergency contact phone",
                    max: 30,
                  },
                ] as const
              ).map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  maxLength={f.max}
                  value={data.profile[f.key] || ""}
                  onChangeText={(text) =>
                    setData({
                      ...data,
                      profile: {
                        ...data.profile,
                        [f.key]:
                          f.key === "date_of_birth" && !text ? null : text,
                      },
                    })
                  }
                />
              ))}
              <Field
                label="Current password (required when changing phone or email)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                maxLength={128}
              />
              <Button
                title={busy ? "Saving…" : "Save profile"}
                disabled={busy}
                onPress={() => void save()}
              />
            </Card>
          ) : (
            <>
              <Card>
                <Text style={{ fontSize: 18, fontWeight: "700" }}>
                  Care details
                </Text>
                <Text>
                  Mobility: {data.profile.mobility_needs || "Not provided"}
                </Text>
                <Text>
                  Communication: {data.profile.communication || "Not provided"}
                </Text>
                <Text>
                  Care notes: {data.profile.care_notes || "Not provided"}
                </Text>
              </Card>
              <Card>
                <Text style={{ fontSize: 18, fontWeight: "700" }}>
                  Emergency contact
                </Text>
                <Text>{data.profile.emergency_name || "Not provided"}</Text>
                <Text>{data.profile.emergency_relationship}</Text>
                <Text>{data.profile.emergency_phone}</Text>
              </Card>
            </>
          )}
        </>
      )}
      <Button
        secondary
        title="Saved locations"
        onPress={() => router.push("/patient/locations")}
      />
      <Button
        secondary
        title="Settings & Support"
        onPress={() => router.push("/patient/settings")}
      />
      <Button
        title="Log out"
        disabled={busy}
        onPress={() =>
          void run(async () => {
            await signOut();
            router.replace("/auth/login-patient");
          })
        }
      />
    </Page>
  );
}
