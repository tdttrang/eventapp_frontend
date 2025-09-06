// app/_layout.js
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider } from "../contexts/AuthContext";
import { useAuth } from "../hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Tạo một instance của QueryClient
const queryClient = new QueryClient();

const RootNavigator = () => {
  const { user, loading } = useAuth();

  // Nếu đang load từ AsyncStorage hoặc đang chờ login setUser → show loading
  if (loading || user === undefined) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#FF6347" />
      </View>
    );
  }

  // Nếu chưa đăng nhập
  if (!user) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    );
  }

  // Nếu là organizer → load organizer layout
  if (user.role?.toLowerCase() === "organizer") {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="organizer" />
      </Stack>
    );
  }

  // Mặc định → attendee
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="tabs" />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
