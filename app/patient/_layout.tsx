import PushRouter from "@/components/push/PushRouter";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Tabs } from "expo-router";
import { Home, CalendarDays, MessageCircle, User } from "lucide-react-native";

export default function PatientLayout() {
  return (
    <RoleGuard role="patient">
      <PushRouter />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#138A8A",
          tabBarInactiveTintColor: "#707588",
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#F0F1F3",
            height: 64,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen name="settings" options={{ href: null }} />
        <Tabs.Screen name="locations" options={{ href: null }} />
        <Tabs.Screen name="support" options={{ href: null }} />
        <Tabs.Screen name="privacy" options={{ href: null }} />
        <Tabs.Screen name="payments" options={{ href: null }} />
        <Tabs.Screen
          name="notifications"
          options={{ title: "Notifications", href: null }}
        />
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: "Bookings",
            tabBarIcon: ({ color, size }) => (
              <CalendarDays size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarIcon: ({ color, size }) => (
              <MessageCircle size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>
    </RoleGuard>
  );
}
