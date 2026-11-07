import React from "react";
import { router, Href } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export function Page({
  title,
  children,
  backTo,
}: {
  backTo?: Href;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        paddingTop: 36,
        gap: 20,
        maxWidth: 680,
        width: "100%",
        alignSelf: "center",
        paddingBottom: 50,
      }}
      style={{ flex: 1, backgroundColor: "#F7FAFA" }}
      keyboardShouldPersistTaps="handled"
    >
      {backTo ? (
        <Button title="Back" secondary onPress={() => router.push(backTo)} />
      ) : null}
      <Text style={{ fontSize: 28, fontWeight: "800", color: "#0B2545" }}>
        {title}
      </Text>
      {children}
    </ScrollView>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        padding: 18,
        borderRadius: 20,
        backgroundColor: "white",
        gap: 14,
      }}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  disabled,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={{
        backgroundColor: secondary ? "#E6F4F4" : "#087F83",
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text
        style={{
          color: secondary ? "#0B2545" : "white",
          fontSize: 16,
          fontWeight: "700",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <Text accessibilityRole="alert" style={{ color: "#B91C1C", fontSize: 16 }}>
      {message}
    </Text>
  ) : null;
}
export const fieldStyle = {
  borderWidth: 1,
  borderColor: "#D9DDE3",
  borderRadius: 12,
  padding: 14,
  fontSize: 16,
  color: "#0B2545",
} as const;
