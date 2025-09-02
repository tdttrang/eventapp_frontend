// tabs/search.js
// Màn hình Search: Header với search bar + filter button, modal bottom sheet cho bộ lọc.
// Bộ lọc: category (dropdown từ /api/events/categories/), location (dropdown từ /api/events/locations/, partial match icontains),
// date range (từ ngày/đến ngày với ModalDateTimePicker), sort by (hardcode từ ordering_fields).
// Fetch từ /api/events/ với params: search, category, location, date__gte, date__lte, ordering.
// Tự động fetch khi thay đổi query/filter qua useEffect.
// Dùng react-native-modal-datetime-picker để thay DateTimePicker, tránh lỗi native module.

import { Ionicons } from "@expo/vector-icons";
import moment from "moment";
import "moment/locale/vi";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi, CLOUD_BASE_URL } from "../services/api";
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
    padding: 15,
    backgroundColor: "#fface8",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 10,
    padding: 10,
  },
  filterModal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  filterContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
    maxHeight: 150,
  },
  pickerItem: {
    padding: 10,
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: "#fface8",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  eventItem: {
    marginVertical: 10,
    marginHorizontal: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 4, // Shadow cho Android
    //shadowOffset: { width: 0, height 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  eventItemImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  eventItemText: {
    padding: 12,
  },
  eventItemName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  eventItemDate: {
    fontSize: 14,
    color: "#555",
    marginBottom: 3,
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
  noResults: {
    textAlign: "center",
    marginTop: 20,
    color: "#777",
  },
});

const fixImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) {
    return url;
  }
  return `${CLOUD_BASE_URL}${url}`;
};

const SORT_OPTIONS = [
  { value: "date", label: "Ngày gần nhất" },
  { value: "-date", label: "Ngày xa nhất" },
  { value: "average_rating", label: "Đánh giá cao nhất" },
  { value: "-average_rating", label: "Đánh giá thấp nhất" },
  { value: "popularity", label: "Phổ biến nhất" },
];

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const catRes = await authApi.get("/api/events/categories/");
        setCategories([""].concat(catRes.data));
      } catch (err) {
        console.log("Fetch categories error:", err);
      }
      try {
        const locRes = await authApi.get("/api/events/locations/");
        setLocations([""].concat(locRes.data));
      } catch (err) {
        console.log("Fetch locations error:", err);
      }
    };
    fetchFilters();
  }, []);

  const fetchEvents = async (pageNumber = 1, reset = false) => {
    if (loading || (pageNumber !== 1 && !hasMore)) return;
    pageNumber === 1 ? setLoading(true) : setLoadingMore(true);
    setError(null);
    try {
      const params = {
        page: pageNumber,
        search: searchQuery || undefined,
        category: category === "" ? undefined : category, // Chỉ gửi undefined nếu rỗng
        location: location === "" ? undefined : location, // Chỉ gửi undefined nếu rỗng
        ordering: sortBy || undefined,
      };

      console.log("Fetch params:", params);
      const res = await authApi.get("/api/events/", { params });
      const newEvents = res.data.results || [];
      if (reset || pageNumber === 1) {
        setEvents(newEvents);
        setPage(2);
      } else {
        setEvents((prev) => [...prev, ...newEvents]);
        setPage(pageNumber + 1);
      }
      setHasMore(!!res.data.next);
    } catch (err) {
      console.log("Search events error:", err.response?.data || err.message);
      setError("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchEvents(1, true);
  }, [searchQuery, category, location, sortBy]);

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

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <Pressable
        style={styles.filterModal}
        onPress={() => setShowFilters(false)}
      >
        <View
          style={styles.filterContent}
          onStartShouldSetResponder={() => true}
        >
          <Text style={styles.filterTitle}>Bộ lọc tìm kiếm</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Danh mục</Text>
              <ScrollView style={styles.pickerContainer}>
                {categories.map((cat, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.pickerItem,
                      {
                        backgroundColor: category === cat ? "#fface8" : "#fff",
                      },
                    ]}
                  >
                    <Text>{cat || "Tất cả"}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Địa điểm</Text>
              <ScrollView style={styles.pickerContainer}>
                {locations.map((loc, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setLocation(loc)}
                    style={[
                      styles.pickerItem,
                      {
                        backgroundColor: location === loc ? "#fface8" : "#fff",
                      },
                    ]}
                  >
                    <Text>{loc || "Tất cả"}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sắp xếp theo</Text>
              <ScrollView style={styles.pickerContainer}>
                {SORT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setSortBy(opt.value)}
                    style={[
                      styles.pickerItem,
                      {
                        backgroundColor:
                          sortBy === opt.value ? "#fface8" : "#fff",
                      },
                    ]}
                  >
                    <Text>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyButtonText}>Áp dụng bộ lọc</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  if (loading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00aaff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#777" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sự kiện..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => fetchEvents(1, true)}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item, index) => `search-event-${item?.id || index}`}
        numColumns={1} // 1 cột, có thể tăng thành 2 nếu muốn lưới
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color="#00aaff" />
          ) : null
        }
        ListEmptyComponent={
          <Text style={styles.noResults}>Không tìm thấy sự kiện nào.</Text>
        }
        contentContainerStyle={{ paddingBottom: 20, paddingTop: 10 }}
      />

      {renderFilterModal()}
    </SafeAreaView>
  );
};

export default Search;
