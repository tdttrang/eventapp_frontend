// app/organizer/notifications.js
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi, endpoints } from "../../services/api";

// --- Hàm tiện ích để hiển thị thời gian ---
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return "Vừa xong";
};

// --- Component Icon cho từng loại thông báo ---
const NotificationIcon = ({ type }) => {
  let iconName;
  let iconColor = "#00796B"; // Màu xanh lá đậm cho đồng bộ

  switch (type) {
    case "event_approved":
      iconName = "checkmark-circle";
      iconColor = "#2ecc71";
      break;
    case "event_rejected":
      iconName = "close-circle";
      iconColor = "#e74c3c";
      break;
    case "new_booking":
      iconName = "cart";
      iconColor = "#3498db";
      break;
    case "review_reply":
      iconName = "chatbubble-ellipses";
      iconColor = "#9b59b6";
      break;
    case "reminder":
      iconName = "time";
      iconColor = "#f39c12";
      break;
    default:
      iconName = "notifications";
      break;
  }
  return <Ionicons name={iconName} size={28} color={iconColor} />;
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

  const fetchNotifications = async () => {
    try {
      const res = await authApi.get(endpoints.notifications);

      // Sửa ở đây: Lấy mảng 'results' từ trong data trả về
      if (res.data && Array.isArray(res.data.results)) {
        setNotifications(res.data.results);
      } else {
        // Nếu API trả về gì đó không đúng, gán một mảng rỗng
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchNotifications();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
    try {
      await authApi.post(endpoints.markAsRead(notificationId));
    } catch (error) {
      console.error(
        `Failed to mark notification ${notificationId} as read:`,
        error
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: false } : n
        )
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    // Nếu không có thông báo nào chưa đọc thì không làm gì cả
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    if (unreadCount === 0) {
      console.log("Không có thông báo chưa đọc để đánh dấu.");
      return;
    }
    // Cập nhật giao diện và gọi API như cũ
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await authApi.post(endpoints.markAllAsRead);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.itemContainer, !item.is_read && styles.unreadItem]}
      onPress={() => !item.is_read && handleMarkAsRead(item.id)}
    >
      <View style={styles.iconContainer}>
        <NotificationIcon type={item.notification_type} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.itemSubject}>{item.subject}</Text>
        <Text style={styles.itemMessage}>{item.message}</Text>
        <Text style={styles.itemTime}>{timeAgo(item.created_at)}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderBackground = () => (
    <LinearGradient
      // --- ĐÂY LÀ MÀU NỀN TỪ MÀN HÌNH EVENTS CỦA BẠN ---
      colors={["#ffbde7", "#b7f7ff"]}
      style={StyleSheet.absoluteFill}
    />
  );

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        {renderBackground()}
        <ActivityIndicator
          size="large"
          color="#00796B" // Màu xanh lá
          style={{ flex: 1 }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {renderBackground()}
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            // Vô hiệu hóa nút nếu không có thông báo nào chưa đọc
            disabled={unreadCount === 0}
          >
            <Text
              style={[
                styles.markAllReadText,
                // Thêm style mờ đi khi bị vô hiệu hóa
                unreadCount === 0 && styles.disabledText,
              ]}
            >
              Đọc tất cả
            </Text>
          </TouchableOpacity>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={80}
              color="rgba(0, 77, 64, 0.7)"
            />
            <Text style={styles.emptyText}>Bạn chưa có thông báo nào</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#00796B"]}
                tintColor="#004D40"
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// --- STYLESHEET ĐÃ ĐƯỢC ĐỒNG BỘ VỚI MÀN HÌNH EVENTS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#004D40", // Màu xanh lá đậm
  },
  markAllReadText: {
    color: "#00796B", // Màu xanh lá
    fontSize: 14,
    fontWeight: "600",
  },
  disabledText: {
    color: "#a0a0a0",
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    flexDirection: "row",
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  unreadItem: {
    backgroundColor: "#e0f2f1", // Màu nền xanh lá rất nhạt
    borderLeftWidth: 4,
    borderLeftColor: "#00796B",
  },
  iconContainer: { marginRight: 15 },
  textContainer: { flex: 1 },
  itemSubject: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#004D40",
  },
  itemMessage: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  itemTime: {
    fontSize: 12,
    color: "#00796B",
    marginTop: 6,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00796B",
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#004D40",
    textAlign: "center",
    marginTop: 16,
  },
});
