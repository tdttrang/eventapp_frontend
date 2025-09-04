import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { authApi, CLOUD_BASE_URL } from "../../../services/api";

export default function ResultScreen() {
  // Lấy query params từ URL
  const { bookingId } = useLocalSearchParams();
  // Hook dieu huong
  const router = useRouter();

  // State luu thong tin booking tu backend
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  // State dem so lan retry goi API
  const [retryCount, setRetryCount] = useState(0);

  // Chay fetchBooking khi component mount
  useEffect(() => {
    // A variable to hold our timer so we can cancel it if the component unmounts
    let retryTimer;

    const performFetch = async () => {
      // If there's no bookingId, or we've run out of retries, stop.
      if (!bookingId || retryCount >= 5) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.get(`api/bookings/${bookingId}/`);
        const data = res.data;
        setBooking(data);

        // If the payment is successful, we're done. Stop loading.
        if (data?.status === "paid") {
          setLoading(false);
        } else {
          // If not paid yet, schedule another retry after 1.5 seconds.
          console.log(
            `Status is '${data?.status}'. Retrying... (${retryCount + 1}/5)`
          );
          retryTimer = setTimeout(() => {
            setRetryCount((prevCount) => prevCount + 1); // This will trigger the useEffect again
          }, 1500);
        }
      } catch (e) {
        console.log("Error fetching booking, scheduling retry...", e);
        // If the API call fails, also schedule a retry.
        retryTimer = setTimeout(() => {
          setRetryCount((prevCount) => prevCount + 1);
        }, 1500);
      }
    };

    performFetch();

    // This is a cleanup function.
    // It runs if the user navigates away from the screen while a retry is pending.
    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
    // This is the dependency array. The effect will re-run whenever
    // bookingId or retryCount changes. This is the key to the fix.
  }, [bookingId, retryCount]);

  // Xac dinh thanh cong dua tren trang thai booking tren server
  const success = booking?.status === "paid";

  // Render khi dang loading
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.note}>
          Đang cập nhật trạng thái đơn hàng... (Thử lại {retryCount + 1}/5)
        </Text>
      </SafeAreaView>
    );
  }

  // Tính tổng tiền dựa trên price * quantity (đã được serializer trả về)
  // Tính tổng tiền
  const displayAmount = booking?.details?.reduce(
    (total, item) =>
      total + parseFloat(item.ticket?.price || 0) * item.quantity,
    0
  );


  // Render giao dien chinh
  return (
    <LinearGradient
      colors={["#ffbde7ff", "#b7f7ffff"]}
      style={styles.container}
    >
      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/tabs")}>
          <Ionicons name="arrow-back" size={24} color="#000000ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả thanh toán</Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>

      {/* Noi dung chinh */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Trang thai thanh toan */}
        <Text style={[styles.status, success ? styles.ok : styles.fail]}>
          {success ? "Thanh toán thành công" : "Thanh toán thất bại"}
        </Text>

        {/* Thong tin giao dich */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin giao dịch</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Booking ID:</Text>
            <Text style={styles.value}>{bookingId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Tổng tiền (VND):</Text>
            <Text style={styles.value}>
              {displayAmount?.toLocaleString("vi-VN")} VND
            </Text>
          </View>
        </View>

        {/* Thông tin đơn hàng */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Trạng thái của vé:</Text>
            <Text style={styles.value}>{booking?.status}</Text>
          </View>

          {/* Chi tiết vé nếu có */}
          {Array.isArray(booking?.details) && booking.details.length > 0 && (
            <>
              <Text style={[styles.label, { marginTop: 8 }]}>Chi tiết vé:</Text>
              {booking.details.map((d) => {
                const linePrice = parseFloat(d.ticket?.price || 0) * d.quantity;
                return (
                  <View key={d.id} style={styles.detailRow}>
                    <Text style={styles.value}>
                      - {d.ticket?.ticket_class} x
                      {d.quantity}
                    </Text>
                    <Text style={styles.value}>
                      {linePrice.toLocaleString("vi-VN")} VND
                    </Text>
                  </View>
                );
              })}
            </>
          )}
        </View>

        {/* Ma QR neu co */}
        {booking?.qr_code && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mã QR của bạn</Text>
            <View style={{ alignItems: "center", marginVertical: 12 }}>
              <Image
                source={{
                  uri: `${CLOUD_BASE_URL}image/upload/${booking.qr_code}.png`,
                }}
                style={{ width: 180, height: 180, marginTop: 8 }}
                resizeMode="contain"
              />
            </View>
          </View>
        )}

        {/* Email neu co */}
        {booking?.user?.email && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Email nhận vé</Text>
            <Text style={{ fontWeight: "600", marginTop: 8 }}>
              {booking.user.email}
            </Text>
          </View>
        )}

        {/* Nut hanh dong */}
        <SafeAreaView edges={["bottom"]} style={styles.actions}>
          <TouchableOpacity
            onPress={() => router.replace("/tabs")}
            style={[styles.buyButton, styles.primary]}
          >
            <Text style={styles.buyButtonText}>Về trang chủ</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScrollView>
    </LinearGradient>
  );
}

// Styles cho man hinh
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "transparent",
    marginTop: 25,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  content: { padding: 16, paddingBottom: 100 },
  status: { fontSize: 18, fontWeight: "800", marginBottom: 12 },
  ok: { color: "rgba(46, 155, 34, 1)" },
  fail: { color: "#c00" },
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
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  label: { color: "#666" },
  value: { fontWeight: "600" },
  detailRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actions: { padding: 12, gap: 10 },
  buyButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  primary: { backgroundColor: "#2ecc71" },
  secondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#bbb",
  },
  buyButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryText: { color: "#222" },
  note: { marginTop: 8, color: "#666" },
});
