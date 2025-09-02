// app/_layout.js
// Cấu hình tab navigation với expo-router, dùng NativeBaseProvider.
// Bottom tabs: index (Home), tickets (Tickets), notification (Notification), profile (Profile).

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { NativeBaseProvider } from "native-base";

export default function TabLayout() {
  return (
    <NativeBaseProvider>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === "index")
              iconName = focused ? "home" : "home-outline";
            else if (route.name === "tickets")
              iconName = focused ? "ticket" : "ticket-outline";
            else if (route.name === "notification")
              iconName = focused ? "notifications" : "notifications-outline";
            else if (route.name === "profile")
              iconName = focused ? "person" : "person-outline";
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#FF6347",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: { backgroundColor: "white" },
          headerShown: false,
        })}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="tickets" options={{ title: "Tickets" }} />
        <Tabs.Screen name="notification" options={{ title: "Notification" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </NativeBaseProvider>
  );
}
