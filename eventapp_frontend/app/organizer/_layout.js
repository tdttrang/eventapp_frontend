// app/organizer/_layout.js
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { NativeBaseProvider } from "native-base";

export default function OrganizerLayout() {
  return (
    <NativeBaseProvider>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            switch (route.name) {
              case "events/index":
                iconName = focused ? "calendar" : "calendar-outline";
                break;
              case "scan/index":
                iconName = focused ? "qr-code" : "qr-code-outline";
                break;
              case "stats/index":
                iconName = focused ? "stats-chart" : "stats-chart-outline";
                break;
              case "notifications":
                iconName = focused ? "notifications" : "notifications-outline";
                break;
              case "profile":
                iconName = focused ? "person" : "person-outline";
                break;
              default:
                iconName = "ellipse-outline";
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#00aaff", // màu tab khi active
          tabBarInactiveTintColor: "gray", // màu tab khi inactive
          tabBarStyle: { backgroundColor: "white" },
          headerShown: false,
        })}
      >
        {/* 5 tab chính */}
        <Tabs.Screen name="events/index" options={{ title: "Sự kiện" }} />
        <Tabs.Screen name="scan/index" options={{ title: "Quét vé" }} />
        <Tabs.Screen name="stats/index" options={{ title: "Thống kê" }} />
        <Tabs.Screen name="notifications" options={{ title: "Thông báo" }} />
        <Tabs.Screen name="profile" options={{ title: "Hồ sơ" }} />

        {/* Ẩn các màn hình con */}
        <Tabs.Screen name="events/create" options={{ href: null }} />
        <Tabs.Screen name="events/[id]" options={{ href: null }} />
        <Tabs.Screen name="scan/[bookingId]" options={{ href: null }} />
      </Tabs>
    </NativeBaseProvider>
  );
}
