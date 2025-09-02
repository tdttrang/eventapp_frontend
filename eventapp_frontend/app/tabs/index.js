// tabs/index.js
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import moment from "moment";
import "moment/locale/vi";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi, CLOUD_BASE_URL } from "../../services/api";
import { useRouter } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fface8",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  logo: {
    width: 120,
    height: 30,
    resizeMode: "contain",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 10,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  bannerBig: {
    position: "relative",
    width: screenWidth,
    height: 200,
  },
  bannerBigImage: {
    width: "100%",
    height: "100%",
  },
  bannerBigButton: {
    position: "absolute",
    bottom: 15,
    left: 15,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bannerBigButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  eventCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
  },
  eventImage: {
    width: "100%",
    height: 100,
    resizeMode: "cover",
  },
  eventInfo: {
    padding: 8,
  },
  eventName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  eventDate: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  eventLocation: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  eventItem: {
    flexDirection: "row",
    marginVertical: 8,
    marginHorizontal: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
  },
  eventItemImage: {
    width: 100,
    height: 100,
  },
  eventItemText: {
    flex: 1,
    padding: 8,
  },
  eventItemName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  eventItemDate: {
    fontSize: 14,
    color: "#555",
  },
  eventItemLocation: {
    fontSize: 14,
    color: "#777",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

const fixImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) {
    return url;
  }
  return `${CLOUD_BASE_URL}${url}`;
};


// BƯỚC 1: ĐƯA HEADERCOMPONENT RA NGOÀI VÀ BỌC BẰNG React.memo
const HeaderComponent = React.memo(
  ({
    bannerEvents,
    trendingEvents,
    recommendedEvents,
    bannerRef,
    trendingListRef,
    recommendedListRef,
    setBannerIndex,
    scrollHorizontally,
  }) => {
    const router = useRouter();
    // Hàm render item cho banner
    const renderBannerItem = ({ item }) => (
      <View style={styles.bannerBig}>
        <Image
          source={{ uri: fixImageUrl(item.media) }}
          style={styles.bannerBigImage}
        />
        <TouchableOpacity
          style={styles.bannerBigButton}
          onPress={() => router.push(`/event-detail/${item.id}`)}
        >
          <Text style={styles.bannerBigButtonText}>Xem chi tiết</Text>
        </TouchableOpacity>
      </View>
    );

    const renderEventCard = ({ item }) => (
      <TouchableOpacity
        onPress={() => router.push(`/event-detail/${item.id}`)}
        style={styles.eventCard}
      >
        <Image
          source={{ uri: fixImageUrl(item.media) }}
          style={styles.eventImage}
        />
        <View style={styles.eventInfo}>
          <Text style={styles.eventName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.eventDate}>
            {moment(item.date).format("DD/MM/YYYY")}
          </Text>
          {item.location && (
            <Text style={styles.eventLocation} numberOfLines={1}>
              {item.location}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );

    return (
      <>
        <View style={styles.headerContainer}>
          <Image
            source={require("../../assets/images/Logo.png")}
            style={styles.logo}
          />
          <TouchableOpacity onPress={() => router.push("/search")}>
            <Ionicons name="search" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Banner lớn */}
        {bannerEvents.length > 0 && (
          <FlatList
            ref={bannerRef}
            data={bannerEvents}
            renderItem={renderBannerItem}
            keyExtractor={(item, index) => `banner-${item?.id || index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={screenWidth}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const newIndex = Math.round(offsetX / screenWidth);
              setBannerIndex(newIndex);
            }}
            getItemLayout={(data, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
          />
        )}

        {/* Section Sự kiện xu hướng */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Sự kiện xu hướng</Text>
          <TouchableOpacity onPress={() => scrollHorizontally(trendingListRef)}>
            <Ionicons
              name="arrow-forward-circle-outline"
              size={30}
              color="#000"
            />
          </TouchableOpacity>
        </View>
        <FlatList
          ref={trendingListRef}
          data={trendingEvents}
          renderItem={renderEventCard}
          keyExtractor={(item, index) => `trending-${item?.id || index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          snapToInterval={162}
          decelerationRate="fast"
        />

        {/* Section Dành cho bạn */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎯 Dành cho bạn</Text>
          <TouchableOpacity
            onPress={() => scrollHorizontally(recommendedListRef)}
          >
            <Ionicons
              name="arrow-forward-circle-outline"
              size={30}
              color="#000"
            />
          </TouchableOpacity>
        </View>
        <FlatList
          ref={recommendedListRef}
          data={recommendedEvents}
          renderItem={renderEventCard}
          keyExtractor={(item, index) => `recommended-${item?.id || index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          snapToInterval={162}
          decelerationRate="fast"
        />

        <Text
          style={[styles.sectionTitle, { marginHorizontal: 10, marginTop: 15 }]}
        >
          📅 Tất cả sự kiện
        </Text>
      </>
    );
  }
);

const Home = () => {
  const trendingListRef = useRef(null);
  const recommendedListRef = useRef(null);
  const bannerRef = useRef(null);
  const [bannerIndex, setBannerIndex] = useState(0);

  const [events, setEvents] = useState([]);
  const [bannerEvents, setBannerEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchEvents = async (pageNumber = 1) => {
    if (loading || (pageNumber !== 1 && !hasMore)) return;
    pageNumber === 1 ? setLoading(true) : setLoadingMore(true);
    setError(null);
    try {
      const res = await authApi.get("/api/events/", {
        params: { page: pageNumber },
      });
      const newEvents = res.data.results || [];
      if (pageNumber === 1) {
        setEvents(newEvents);
        setBannerEvents(newEvents.slice(0, 3));
        setTrendingEvents(newEvents.slice(1, 5));
        setRecommendedEvents(newEvents.slice(5, 9));
        setPage(2); // Đặt lại page về 2 sau khi load trang đầu
      } else {
        setEvents((prev) => [...prev, ...newEvents]);
        setPage(pageNumber + 1); // Tăng page khi load thêm
      }
      if (res.data.next) {
        setHasMore(true);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.log("Fetch events error:", err.response?.data || err.message);
      setError("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents(1);
    }, [])
  );

  // useEffect tự động chuyển banner (đã sửa từ lần trước, vẫn giữ nguyên)
  useEffect(() => {
    if (bannerEvents.length > 1) {
      const timer = setInterval(() => {
        setBannerIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % bannerEvents.length;
          bannerRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [bannerEvents]);

  const renderEventItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/event-detail/${item.id}`)}
      style={styles.eventItem}
    >
      <Image
        source={{ uri: fixImageUrl(item.media) }}
        style={styles.eventItemImage}
      />
      <View style={styles.eventItemText}>
        <Text style={styles.eventItemName}>{item.name}</Text>
        <Text style={styles.eventItemDate}>
          {moment(item.date).format("DD/MM/YYYY")}
        </Text>
        <Text style={styles.eventItemLocation}>{item.location}</Text>
      </View>
    </TouchableOpacity>
  );

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchEvents(page);
    }
  };

  // BƯỚC 2: BỌC HÀM TRUYỀN XUỐNG BẰNG `useCallback`
  const scrollHorizontally = useCallback((listRef) => {
    if (listRef.current) {
      listRef.current.scrollToEnd({ animated: true });
    }
  }, []);

  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00aaff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={events}
        renderItem={renderEventItem}
        removeClippedSubviews={false}
        keyExtractor={(item, index) => `event-${item?.id || index}`}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        // BƯỚC 3: TRUYỀN PROPS VÀO HEADERCOMPONENT
        ListHeaderComponent={
          <HeaderComponent
            bannerEvents={bannerEvents}
            trendingEvents={trendingEvents}
            recommendedEvents={recommendedEvents}
            bannerRef={bannerRef}
            trendingListRef={trendingListRef}
            recommendedListRef={recommendedListRef}
            setBannerIndex={setBannerIndex}
            scrollHorizontally={scrollHorizontally}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color="#00aaff" />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.loadingContainer}>
            <Text>Không có sự kiện nào để hiển thị.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Home;
