import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SelectTicketModal from "../../components/SelectTicketModal";
import { api, CLOUD_BASE_URL } from "../../services/api";

export default function EventDetail() {
  // --- BƯỚC 1: Gọi tất cả các hooks ---
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchData = useCallback(() => {
    if (id) {
      setLoading(true);
      api
        .get(`/api/events/${id}/`)
        .then((res) => setEvent(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  // Tải dữ liệu khi component mount hoặc id thay đổi
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // --- BƯỚC 2: Định nghĩa tất cả các hàm xử lý ---
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${CLOUD_BASE_URL}${path}`;
  };

  const handleBookingCreated = (bookingId, eventName) => {
    setShowModal(false);
    router.push({
      pathname: `/checkout/review/${bookingId}`,
      params: { eventId: id, eventName },
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleBuyTicket = () => {
    setShowModal(true);
  };

  // --- BƯỚC 3: Xử lý các trường hợp return sớm ---
  if (loading) {
    return <ActivityIndicator style={styles.center} />;
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy sự kiện.</Text>
      </View>
    );
  }

  // --- BƯỚC 4: Return giao diện chính ---
  return (
    <>
      <LinearGradient colors={["#ffbde7ff", "#b7f7ffff"]} style={{ flex: 1 }}>
        <SafeAreaView edges={["top"]} style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#000000ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết sự kiện</Text>
          <View style={{ width: 24 }} />
        </SafeAreaView>

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Banner */}
          {event.media && (
            <Image
              source={{ uri: getImageUrl(event.media) }}
              style={styles.banner}
            />
          )}

          {/* Thông tin cơ bản */}
          <View style={styles.card}>
            <Text style={styles.title}>{event.name}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#555" />
              <Text style={styles.infoText}>
                {moment(event.date).format("HH:mm, DD/MM/YYYY")}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#555" />
              <Text style={styles.infoText}>{event.location}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={20} color="#555" />
              <Text style={[styles.infoText, { color: "#e53935" }]}>
                Từ {Number(event.ticket_price_regular).toLocaleString()}đ -{" "}
                {Number(event.ticket_price_vip).toLocaleString()}đ
              </Text>
            </View>
          </View>

          {/* Đánh giá */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Đánh giá & Bình luận</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={24} color="#f1c40f" />
              <Text style={styles.ratingText}>
                {event.average_rating
                  ? Number(event.average_rating).toFixed(1)
                  : "Chưa có"}
              </Text>
              <Text style={styles.reviewCount}>
                ({event.reviews?.length || 0} đánh giá)
              </Text>
            </View>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => router.push(`/reviews/${event.id}`)}
            >
              <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
              <Text style={styles.reviewButtonText}>Xem tất cả đánh giá</Text>
            </TouchableOpacity>
          </View>

          {/* Danh sách vé */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Danh sách vé</Text>
            {event.tickets?.length > 0 ? (
              event.tickets.map((ticket) => (
                <View key={ticket.id} style={styles.ticketCard}>
                  <Text style={styles.ticketType}>{ticket.ticket_class}</Text>
                  <Text style={styles.ticketPrice}>
                    {Number(ticket.price).toLocaleString()}đ
                  </Text>
                </View>
              ))
            ) : (
              <Text>Không có vé khả dụng.</Text>
            )}
          </View>
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={styles.buyButtonContainer}>
          <TouchableOpacity style={styles.buyButton} onPress={handleBuyTicket}>
            <Text style={styles.buyButtonText}>Mua vé ngay</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      <SelectTicketModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        eventId={Number(id)} // ép kiểu ở đây
        onBookingCreated={handleBookingCreated}
      />
    </>
  );
}

// Giữ nguyên styles
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  banner: { width: "100%", height: 220, borderRadius: 12, marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  infoText: { marginLeft: 8, fontSize: 15, color: "#333" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  ratingText: { fontSize: 16, fontWeight: "bold", marginLeft: 6 },
  reviewCount: { marginLeft: 6, color: "#888" },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2ecc71",
    padding: 10,
    borderRadius: 6,
  },
  reviewButtonText: { color: "#fff", marginLeft: 6, fontWeight: "600" },
  ticketCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  ticketType: { fontSize: 15, fontWeight: "500" },
  ticketPrice: { fontSize: 15, fontWeight: "bold", color: "#e53935" },
  buyButtonContainer: {
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  buyButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buyButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
