// app/organizer/events/index.js
import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi } from "../../../services/api";

// --- COMPONENT EVENT CARD ĐƯỢC THIẾT KẾ LẠI ---
const EventCard = ({ item }) => {
  const router = useRouter();
  const imageUrl =
    item.media && item.media.length > 0
      ? item.media[0].file
      : "https://via.placeholder.com/150";

  // Định dạng lại ngày tháng
  const eventDate = new Date(item.date);
  const day = eventDate.getDate();
  const month = eventDate.toLocaleString("vi-VN", { month: "short" });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/organizer/events/${item.id}`)}
    >
      <ImageBackground
        source={{ uri: imageUrl }}
        style={styles.cardImage}
        imageStyle={{ borderRadius: 16 }}
      >
        <BlurView intensity={20} tint="dark" style={styles.cardDateContainer}>
          <Text style={styles.cardDateDay}>{day}</Text>
          <Text style={styles.cardDateMonth}>{month}</Text>
        </BlurView>
      </ImageBackground>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#4CAF50" />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="pricetag-outline" size={16} color="#00796B" />
          <Text style={styles.infoText}>{item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- COMPONENT MÀN HÌNH CHÍNH ---
export default function OrganizerEventsScreen() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["organizerEvents"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await authApi.get(`/api/events/?page=${pageParam}`);
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next);
        return url.searchParams.get("page");
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const events = data?.pages.flatMap((page) => page.results) ?? [];

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderContent = () => {
    if (isLoading && !data) {
      return (
        <ActivityIndicator
          size="large"
          color="#fff"
          style={{ marginTop: 50 }}
        />
      );
    }
    if (isError) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Có lỗi xảy ra khi tải dữ liệu.</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (events.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="calendar-outline"
            size={80}
            color="rgba(255, 255, 255, 0.7)"
          />
          <Text style={styles.emptyText}>Bạn chưa có sự kiện nào</Text>
          <Text style={styles.emptySubText}>
            Nhấn nút '+' để bắt đầu tạo sự kiện mới!
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        data={events}
        renderItem={({ item }) => <EventCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#fff"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator
              size="small"
              color="#fff"
              style={{ marginVertical: 20 }}
            />
          ) : null
        }
      />
    );
  };

  return (
    <LinearGradient
      colors={["#ffbde7ff", "#b7f7ffff"]} // Gradient từ hồng nhạt sang xanh nhạt
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quản lý sự kiện</Text>
        </View>

        {/* Content */}
        {renderContent()}

        {/* Nút Tạo Mới (Floating Action Button) */}
        <Link href="/organizer/events/create" asChild>
          <TouchableOpacity style={styles.fab}>
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>
        </Link>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Thay thế toàn bộ đối tượng styles cũ bằng cái này
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#004D40", // 👈 Đổi sang màu tối
  },
  listContainer: {
    paddingHorizontal: 10,
    paddingBottom: 80, 
  },
  card: {
    marginVertical: 10,
    flexDirection: 'row',
    ...Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 5,
        },
        android: {
            elevation: 5,
        },
    }),
  },
  cardImage: {
    width: 120,
    height: 120,
    justifyContent: 'flex-end',
  },
  cardDateContainer: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 5,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    width: '60%',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardDateDay: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardDateMonth: {
    fontSize: 14,
    color: '#fff',
    textTransform: 'uppercase',
  },
  cardContent: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#004D40", // 👈 Đổi sang màu tối
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
    flexShrink: 1, 
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00796B', // 👈 Đổi màu xanh lá cho hợp theme
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: "#004D40", // 👈 Đổi sang màu tối
    textAlign: "center",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 15,
    color: "#00796B", // 👈 Đổi sang màu tối
    textAlign: "center",
    marginTop: 8,
    maxWidth: '80%',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#00796B', // 👈 Đổi màu xanh lá
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
