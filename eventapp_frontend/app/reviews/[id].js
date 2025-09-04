// app/reviews/[id].js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { authApi } from "../../services/api";
import moment from "moment";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function EventReviews() {
  const { id } = useLocalSearchParams(); // id là event.id
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log("Fetching event with id:", id); // Debug ID
      const eventRes = await authApi.get(`/api/events/${id}/`);
      setEvent(eventRes.data);

      console.log("Fetching reviews for event_id:", id); // Debug
      const reviewsRes = await authApi.get(`/api/reviews/?event_id=${id}`);
      console.log("Dữ liệu reviews nhận được:", reviewsRes.data);

      setReviews(reviewsRes.data.results);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.response?.status === 404) {
        Alert.alert(
          "Lỗi",
          `Không tìm thấy dữ liệu sự kiện hoặc đánh giá với ID: ${id}. Vui lòng kiểm tra lại.`
        );
      } else {
        Alert.alert("Lỗi", "Không thể tải dữ liệu. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (userRating < 1 || userRating > 5) {
      Alert.alert("Lỗi", "Vui lòng chọn đánh giá từ 1 đến 5 sao.");
      return;
    }
    if (!userComment.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập bình luận.");
      return;
    }

    try {
      const payload = {
        event: parseInt(id, 10),
        rating: userRating,
        comment: userComment,
      };
      const response = await authApi.post(`/api/reviews/`, payload);

      // Xử lý khi gửi thành công
      if (response.status === 201) {
        Alert.alert("Thành công", "Đánh giá của bạn đã được gửi.");
        setUserRating(0);
        setUserComment("");

        // lấy dữ liệu review từ phản hồi của backend
        const newReview = response.data;
        // thêm review mới vào đầu danh sách
        setReviews((prevReviews) => [newReview, ...prevReviews]);
      }
    } catch (err) {
      //console.error("Error submitting review:", err); // Giữ lại để debug

      // BẮT LỖI 403 VÀ CÁC LỖI KHÁC TỪ SERVER
      if (err.response) {
        const errorData = err.response.data;
        // Trường hợp cụ thể: Lỗi 403 do chưa tham gia sự kiện
        if (err.response.status === 403) {
          Alert.alert(
            "Thông báo",
            errorData.detail || "Bạn cần tham gia sự kiện trước khi bình luận."
          );
        }
        // Các lỗi khác từ server (500, 404,...)
        else {
          Alert.alert(
            "Đã có lỗi xảy ra",
            errorData?.detail || "Không thể gửi đánh giá. Vui lòng thử lại sau."
          );
        }
      }
      // Bắt lỗi mạng (khi không có kết nối internet)
      else if (err.request) {
        Alert.alert(
          "Lỗi kết nối",
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng."
        );
      }
      // Các lỗi không xác định khác
      else {
        Alert.alert(
          "Lỗi không xác định",
          "Đã có lỗi xảy ra trong quá trình gửi đánh giá."
        );
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const handleBack = () => {
    router.back();
  };

  const renderStarRating = () => {
    return (
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
            <Ionicons
              name={star <= userRating ? "star" : "star-outline"}
              size={28}
              color="#f1c40f"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewUser}>
          {item.user?.username || "Ẩn danh"}
        </Text>
        <View style={styles.reviewRating}>
          <Ionicons name="star" size={16} color="#f1c40f" />
          <Text style={styles.reviewRatingText}>{item.rating}</Text>
        </View>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
      <Text style={styles.reviewDate}>
        {moment(item.created_at).format("DD/MM/YYYY HH:mm")}
      </Text>

      {item.replies?.length > 0 && (
        <View style={styles.repliesContainer}>
          <Text style={styles.repliesTitle}>Phản hồi từ nhà tổ chức:</Text>
          {item.replies.map((reply) => (
            <View key={reply.id} style={styles.replyItem}>
              <Text style={styles.replyUser}>
                {reply.user?.username || "Nhà tổ chức"}
              </Text>
              <Text style={styles.replyText}>{reply.reply_text}</Text>
              <Text style={styles.replyDate}>
                {moment(reply.created_at).format("DD/MM/YYYY HH:mm")}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  if (loading) {
    return <ActivityIndicator style={styles.center} />;
  }

  return (
    <LinearGradient colors={["#ffbde7ff", "#b7f7ffff"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#000000ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá & Bình luận</Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>

      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Tổng quan</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={24} color="#f1c40f" />
                <Text style={styles.ratingText}>
                  {event?.average_rating
                    ? Number(event.average_rating).toFixed(1)
                    : "Chưa có"}
                </Text>
                <Text style={styles.reviewCount}>
                  ({reviews.length} đánh giá)
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Viết đánh giá của bạn</Text>
              {renderStarRating()}
              <TextInput
                style={styles.commentInput}
                multiline
                placeholder="Nhập bình luận..."
                value={userComment}
                onChangeText={setUserComment}
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitReview}
              >
                <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          !loading && reviews.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Chưa có bình luận nào</Text>
              <Text style={styles.muted}>
                Hãy là người đầu tiên đánh giá sự kiện này!
              </Text>
            </View>
          ) : null
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </LinearGradient>
  );
}

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
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  ratingText: { fontSize: 16, fontWeight: "bold", marginLeft: 6 },
  reviewCount: { marginLeft: 6, color: "#888" },
  starRow: { flexDirection: "row", marginBottom: 12 },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  reviewItem: {
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
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  reviewUser: { fontWeight: "bold" },
  reviewRating: { flexDirection: "row", alignItems: "center" },
  reviewRatingText: { marginLeft: 4, fontWeight: "bold" },
  reviewComment: { color: "#333", marginBottom: 4 },
  reviewDate: { color: "#888", fontSize: 12 },
  repliesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  repliesTitle: { fontWeight: "600", marginBottom: 8 },
  replyItem: { marginBottom: 8 },
  replyUser: { fontWeight: "bold", color: "#2ecc71" },
  replyText: { color: "#333" },
  replyDate: { color: "#888", fontSize: 12 },
});
