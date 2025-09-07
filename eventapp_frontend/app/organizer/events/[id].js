// File: app/organizer/events/[id].js
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi } from "../../../services/api";
import * as ImagePicker from "expo-image-picker";



// --- Function để gọi API chi tiết sự kiện ---
const fetchEventDetails = async (id) => {
  const { data } = await authApi.get(`/api/events/${id}/`);
  return data;
};

// --- Function để gọi API lấy danh sách vé của sự kiện ---
const fetchEventTickets = async (id) => {
  const { data } = await authApi.get(`/api/tickets/?event=${id}`);
  return data.results; 
};

const EventDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Lấy ID của sự kiện từ URL

  const queryClient = useQueryClient();

  const updateEventMutation = useMutation({
    mutationFn: (formData) =>
      authApi.patch(`/api/events/${id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    // thêm data để lấy phản hồi từ api
    onSuccess: (data) => {
      console.log("Phản hồi từ server:", data.media);
      Alert.alert("Thành công", "Đã cập nhật ảnh sự kiện.");
      queryClient.invalidateQueries({ queryKey: ["eventDetails", id] });
    },
    onError: (error) => {
      console.error("Update image error:", error.response?.data);
      Alert.alert("Lỗi", "Không thể cập nhật ảnh. Vui lòng thử lại.");
    },
  });

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần cấp quyền', 'Cần quyền truy cập thư viện ảnh để tải lên hình ảnh.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      const formData = new FormData();
      formData.append("media", {
        uri: result.assets[0].uri,
        name: `event-${id}.jpg`,
        type: "image/jpeg",
      });
      updateEventMutation.mutate(formData);
    }
  };

  const deleteEventMutation = useMutation({
    mutationFn: () => authApi.delete(`/api/events/${id}/`),
    onSuccess: () => {
      Alert.alert("Thành công", "Đã xóa sự kiện.");
      queryClient.invalidateQueries({ queryKey: ["organizerEvents"] });
      router.back();
    },
    onError: (error) => {
      console.error("Delete event error:", error.response?.data);
      Alert.alert("Lỗi", "Không thể xóa sự kiện. Vui lòng thử lại.");
    },
  });

  const handleDelete = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa sự kiện này không? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy bỏ", style: "cancel" },
        {
          text: "Xóa",
          onPress: () => deleteEventMutation.mutate(),
          style: "destructive",
        },
      ]
    );
  };

  // --- Gọi API lấy chi tiết sự kiện ---
  const {
    data: event,
    isLoading: isLoadingEvent,
    error: eventError,
    refetch: refetchEvent,
  } = useQuery({
    queryKey: ["eventDetails", id],
    queryFn: () => fetchEventDetails(id),
  });

  // --- Gọi API lấy danh sách vé ---
  const {
    data: tickets,
    isLoading: isLoadingTickets,
    error: ticketsError,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ["eventTickets", id],
    queryFn: () => fetchEventTickets(id),
  });

  const onRefresh = React.useCallback(() => {
    refetchEvent();
    refetchTickets();
  }, []);

  if (isLoadingEvent || isLoadingTickets) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00796B" />
      </View>
    );
  }

  if (eventError || ticketsError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Lỗi tải dữ liệu. Vui lòng thử lại.</Text>
      </View>
    );
  }

  const imageUrl = event.media || "https://via.placeholder.com/400x200";
  const eventDate = new Date(event.date);

  return (
    <LinearGradient colors={["#E0F2F1", "#B2DFDB"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoadingEvent} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#004D40" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết sự kiện</Text>
            {/* Các nút hành động */}
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash-outline" size={24} color="#e74c3c" />
              </TouchableOpacity>
              {/* Nút Chỉnh sửa sẽ được làm ở bước sau */}
              <TouchableOpacity
                onPress={() => router.push(`/organizer/events/edit/${id}`)}
                style={{ marginLeft: 16 }}
              >
                <Ionicons name="create-outline" size={24} color="#004D40" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image */}
          <Image
            source={{ uri: `${imageUrl}?t=${Date.now()}` }}
            style={styles.eventImage}
          />
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePickImage}
          >
            <Ionicons name="camera-outline" size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>Tải ảnh lên</Text>
          </TouchableOpacity>
          {/* Event Info */}
          <View style={styles.contentContainer}>
            <Text style={styles.eventName}>{event.name}</Text>
            <InfoRow
              icon="calendar-outline"
              text={eventDate.toLocaleDateString("vi-VN")}
            />
            <InfoRow
              icon="time-outline"
              text={eventDate.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
            <InfoRow icon="location-outline" text={event.location} />
            <InfoRow icon="pricetag-outline" text={event.category} />

            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={styles.description}>{event.description}</Text>

            {/* Ticket Info */}
            <Text style={styles.sectionTitle}>Các loại vé</Text>
            {tickets && tickets.length > 0 ? (
              tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))
            ) : (
              <Text style={styles.noTicketsText}>Chưa có vé nào được tạo.</Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// --- Component phụ để hiển thị thông tin ---
const InfoRow = ({ icon, text }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={20} color="#00796B" />
    <Text style={styles.infoText}>{text}</Text>
  </View>
);

// --- Component phụ để hiển thị thông tin vé ---
const TicketCard = ({ ticket }) => (
  <View style={styles.ticketCard}>
    <View style={styles.ticketIconContainer}>
      <Ionicons name="pricetag-outline" size={24} color="#004D40" />
    </View>
    <View style={styles.ticketInfoContainer}>
      <Text style={styles.ticketClass}>{ticket.ticket_class}</Text>
      <Text style={styles.ticketDetails}>
        Giá: {Number(ticket.price).toLocaleString("vi-VN")}đ - SL:{" "}
        {ticket.quantity}
      </Text>
    </View>
  </View>
);

export default EventDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "red", fontSize: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#004D40" },
  headerActions: { flexDirection: "row", alignItems: "center" },
  eventImage: {
    width: "100%",
    height: 250,
  },
  uploadButton: {
    position: "absolute",
    top: 250, // Vị trí của header + chiều cao ảnh
    right: 20,
    transform: [{ translateY: -20 }], // Đẩy nút lên 1 nửa chiều cao
    flexDirection: "row",
    backgroundColor: "#00796B",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    elevation: 5,
  },
  uploadButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "bold",
  },
  contentContainer: { padding: 20 },
  eventName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#004D40",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#004D40",
    marginTop: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
  },
  noTicketsText: {
    fontSize: 16,
    color: "#777",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
  ticketCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  ticketIconContainer: {
    backgroundColor: "#C8E6C9",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  ticketInfoContainer: {
    flex: 1,
  },
  ticketClass: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#004D40",
  },
  ticketDetails: {
    fontSize: 15,
    color: "#333",
    marginTop: 4,
  },
});
