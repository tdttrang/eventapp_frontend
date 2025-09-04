// app/tabs/notification.js
import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import "moment/locale/vi";
import {
  Box,
  Divider,
  HStack,
  Heading,
  Icon,
  VStack,
  useToast,
} from "native-base";
import { useCallback, useEffect, useState } from "react";
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
import { authApi } from "../../services/api"; // Sử dụng authApi

moment.locale("vi");

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const fetchNotifications = useCallback(
    async (pageNumber = 1) => {
      try {
        const res = await authApi.get(`/api/notifications/`, {
          params: { page: pageNumber, page_size: 10 },
        });
        const newNotifications = res.data.results;
        setNotifications((prevNotifications) =>
          pageNumber === 1
            ? newNotifications
            : [...prevNotifications, ...newNotifications]
        );
        setHasMore(!!res.data.next); // Kiểm tra xem còn trang tiếp theo không
      } catch (err) {
        toast.show({
          title: "Lỗi",
          description: "Không thể tải thông báo.",
          status: "error",
        });
        console.error("Lỗi khi tải thông báo:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((prevPage) => prevPage + 1);
      fetchNotifications(page + 1);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setNotifications([]); // Xóa danh sách cũ
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handlePressNotification = async (notification) => {
    // Nếu thông báo chưa được đọc, gọi API để đánh dấu đã đọc
    if (!notification.is_read) {
      try {
        await authApi.patch(
          `/api/notifications/${notification.id}/mark_as_read/`
        );
        // Cập nhật trạng thái is_read trên UI
        setNotifications((prevNotifications) =>
          prevNotifications.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      } catch (err) {
        toast.show({
          title: "Lỗi",
          description: "Không thể đánh dấu đã đọc.",
          status: "error",
        });
        console.error("Lỗi khi đánh dấu đã đọc:", err);
      }
    }
    // TODO: Có thể thêm logic điều hướng ở đây, ví dụ: chuyển sang màn hình Chi tiết Sự kiện
    // router.push(`/event-detail/${notification.related_object_id}`);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handlePressNotification(item)}>
      <Box style={styles.notificationCard}>
        <HStack space={3} alignItems="center">
          <Icon
            as={Ionicons}
            name={item.is_read ? "mail-open" : "mail"}
            size="2xl"
            color={item.is_read ? "gray.400" : "blue.500"}
          />
          <VStack flex={1}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text
                style={[
                  styles.notificationSubject,
                  !item.is_read && styles.unreadSubject,
                ]}
              >
                {item.subject}
              </Text>
              {!item.is_read && <Box style={styles.unreadBadge} />}
            </HStack>
            <Text
              style={[
                styles.notificationMessage,
                !item.is_read && styles.unreadMessage,
              ]}
              numberOfLines={2}
            >
              {item.message}
            </Text>
            <Text style={styles.notificationTime}>
              {moment(item.created_at).fromNow()}
            </Text>
          </VStack>
        </HStack>
        <Divider style={styles.divider} />
      </Box>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <VStack space={4} p={4}>
        <Heading size="lg" style={styles.header}>
          Thông báo của bạn
        </Heading>
        {notifications.length > 0 ? (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#0000ff"
              />
            }
          />
        ) : (
          <Box style={styles.emptyContainer}>
            <Icon
              as={Ionicons}
              name="notifications-off-outline"
              size="6xl"
              color="gray.400"
            />
            <Text style={styles.emptyText}>Bạn chưa có thông báo nào.</Text>
          </Box>
        )}
      </VStack>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  notificationCard: {
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  notificationSubject: {
    fontSize: 16,
    fontWeight: "bold",
  },
  unreadSubject: {
    color: "#2196F3",
  },
  notificationMessage: {
    fontSize: 14,
    color: "gray",
    marginTop: 4,
  },
  unreadMessage: {
    fontWeight: "bold",
  },
  notificationTime: {
    fontSize: 12,
    color: "#a0a0a0",
    marginTop: 4,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2196F3",
  },
  divider: {
    marginTop: 15,
    backgroundColor: "#e0e0e0",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "gray",
    marginTop: 10,
  },
  footer: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderColor: "#e0e0e0",
  },
});

export default NotificationScreen;
