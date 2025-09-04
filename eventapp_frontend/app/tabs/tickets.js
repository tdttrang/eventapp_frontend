// app/(tabs)/tickets.js

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import moment from "moment";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, authApi, CLOUD_BASE_URL } from "../../services/api";

// --- Component Card hiển thị thông tin từng vé ---
const TicketCard = React.memo(({ booking }) => {
  // Lấy thông tin event từ booking.details
  // Giả định mỗi booking chỉ thuộc về 1 sự kiện
  const event = booking.details?.[0]?.ticket?.event;

  if (!event) {
    return null; // Không hiển thị nếu không có thông tin sự kiện
  }

  const getImageUrl = (path) => {
    if (!path) return "https://via.placeholder.com/100"; // Ảnh mặc định
    if (path.startsWith("http")) return path;
    return `${CLOUD_BASE_URL}${path}`;
  };

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: getImageUrl(event.media) }}
        style={styles.eventImage}
      />
      <View style={styles.cardContent}>
        <Text style={styles.eventName} numberOfLines={2}>
          {event.name}
        </Text>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#555" />
          <Text style={styles.infoText}>
            {moment(event.date).format("HH:mm, DD/MM/YYYY")}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#555" />
          <Text style={styles.infoText} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
        <View style={styles.qrContainer}>
          <Text style={styles.qrText}>Mã vé của bạn:</Text>
          {/* Ở đây bạn có thể hiển thị QR code thật nếu có thư viện */}
          <Image
            source={{ uri: getImageUrl(booking.qr_code) }}
            style={styles.qrCode}
          />
        </View>
      </View>
    </View>
  );
});

// --- Màn hình chính ---
export default function MyTicketsScreen() {
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' hoặc 'past'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Hàm fetch dữ liệu chính
  const fetchData = async () => {
    try {
      // BƯỚC 1: LẤY DANH SÁCH BOOKING CỦA USER
      const bookingRes = await authApi.get("/api/bookings/paid/");

      // truy cập vào trường 'results'
      const allBookings = bookingRes.data.results || bookingRes.data || [];
      setBookings(allBookings);
    } catch (err) {
      console.error("Lỗi khi tải vé:", err.response?.data || err.message);
      setBookings([]); // Set thành mảng rỗng nếu có lỗi để tránh crash
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Sử dụng useFocusEffect để tải lại dữ liệu mỗi khi người dùng quay lại màn hình này
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  // Lọc danh sách vé theo tab đang chọn
  const filteredBookings = bookings.filter((booking) => {
    const eventDate = moment(booking.details?.[0]?.ticket?.event?.date);
    if (activeTab === "upcoming") {
      return eventDate.isAfter(moment());
    } else {
      return eventDate.isBefore(moment());
    }
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#fface8" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vé của tôi</Text>
      </View>

      {/* Thanh Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.activeTabText,
            ]}
          >
            Sắp diễn ra
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "past" && styles.activeTab]}
          onPress={() => setActiveTab("past")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "past" && styles.activeTabText,
            ]}
          >
            Đã qua
          </Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách vé */}
      <FlatList
        data={filteredBookings}
        renderItem={({ item }) => <TicketCard booking={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              Bạn không có vé nào trong mục này.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// --- Toàn bộ Styles của màn hình ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    paddingVertical: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#fface8",
  },
  tabText: {
    fontSize: 16,
    color: "#555",
  },
  activeTabText: {
    color: "#000",
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  eventImage: {
    width: 100,
    height: "100%",
    resizeMode: "cover",
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  eventName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
    flexShrink: 1,
  },
  qrContainer: {
    marginTop: 8,
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#eee",
    paddingTop: 8,
  },
  qrText: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
  },
  qrCode: {
    width: 80,
    height: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#888",
  },
});
