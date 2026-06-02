import React from "react";
import { Tabs } from "expo-router";
import { Home, ClipboardList, Wallet, User } from "lucide-react-native";

const COLORS = {
  teal: "#138A8A",
  slate: "#707588",
  white: "#FFFFFF",
  border: "#F0F1F3",
};

export default function PhysioLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.teal,
        tabBarInactiveTintColor: COLORS.slate,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 64,
          paddingBottom: 9,
          paddingTop: 7,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Home size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ color }) => (
            <ClipboardList size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color }) => (
            <Wallet size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <User size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />
    </Tabs>
  );
}
