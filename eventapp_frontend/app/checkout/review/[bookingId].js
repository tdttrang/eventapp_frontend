import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi } from "../../../services/api";

export default function ReviewBooking() {
  const params = useLocalSearchParams();
  const bookingId = params?.bookingId ? Number(params.bookingId) : null;
  const eventId = params?.eventId ? Number(params.eventId) : null;
  const eventNameParam = params?.eventName || "";

  const router = useRouter();

  // State dữ liệu
  const [eventTitle, setEventTitle] = useState(eventNameParam);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // State chọn phương thức thanh toán (mặc định VNPay)
  // Tip: Nếu sau này có thêm phương thức, chỉ cần mở rộng mảng paymentMethods (ở dưới)
  const [paymentMethod, setPaymentMethod] = useState("vnpay");

  // Nếu chưa có eventNameParam thì mới gọi API
  useEffect(() => {
    if (!eventNameParam && eventId) {
      authApi
        .get(`/api/events/${eventId}/`)
        .then((res) => {
          setEventTitle(res.data?.name || "");
        })
        .catch((err) => {
          console.error("❌ Lỗi khi fetch event:", err.response?.data || err);
        });
    }
  }, [eventId, eventNameParam]);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = await AsyncStorage.getItem("access-token");
        const res = await authApi.get(`/api/bookings/${bookingId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(
          "DỮ LIỆU BOOKING NHẬN ĐƯỢC:",
          JSON.stringify(res.data, null, 2)
        );
        setBooking(res.data);
      } catch (err) {
        console.error("❌ Lỗi khi load booking:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) fetchBooking();
  }, [bookingId]);

  // Tính toán tổng số lượng và tổng tiền từ details
  const details = booking?.details || [];

  const totalQuantity = useMemo(
    () => details.reduce((sum, d) => sum + (d.quantity || 0), 0),
    [details]
  );
  const totalPrice = useMemo(
    () =>
      details.reduce(
        (sum, d) => sum + Number(d.price || 0) * (d.quantity || 0),
        0
      ),
    [details]
  );

  if (!bookingId) {
    return (
      <View style={styles.center}>
        <Text>Thiếu thông tin bookingId.</Text>
      </View>
    );
  }

  // Loading UI
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
        <Text style={{ marginTop: 8 }}>Đang tải thông tin đặt vé...</Text>
      </View>
    );
  }

  // Error/empty state
  if (!booking) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy booking.</Text>
      </View>
    );
  }

  // Danh sách phương thức thanh toán hiển thị
  const paymentMethods = [
    {
      key: "vnpay",
      title: "Thanh toán qua VNPay (Thẻ nội địa/ATM)",
      subtitle: "Hỗ trợ hầu hết ngân hàng nội địa",
      icon: "card-outline",
    },
    // Có thể thêm các phương thức khác ở đây
    // { key: "momo", title: "Ví MoMo", subtitle: "Quét mã / liên kết ví", icon: "logo-usd" }
  ];

  // Xử lý action Thanh toán
  const handlePay = () => {
    // Điều hướng kèm phương thức đã chọn (đơn giản hoá: append query)
    router.push(`/payment/${bookingId}?method=${paymentMethod}`);
  };

  // Helper format VND
  const currency = (n) => Number(n || 0).toLocaleString("vi-VN") + " VND";

  return (
    <LinearGradient colors={["#ffbde7ff", "#b7f7ffff"]} style={{ flex: 1 }}>
      {/* Header giống EventDetail */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000000ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận đặt vé</Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Card: Thông tin sự kiện */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin sự kiện</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Sự kiện</Text>
            <Text style={styles.value} numberOfLines={1}>
              {eventTitle || details?.[0]?.event_name || "Đang cập nhật"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Số lượng vé</Text>
            <Text style={styles.value}>{totalQuantity}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Tổng tiền</Text>
            <Text style={[styles.value, { color: "#e53935" }]}>
              {currency(totalPrice)}
            </Text>
          </View>
        </View>

        {/* Card: Danh sách vé */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Danh sách vé</Text>
          {details.length === 0 ? (
            <Text style={styles.muted}>Chưa có vé trong booking này.</Text>
          ) : (
            details.map((d) => {
              const lineTotal = Number(d.price || 0) * (d.quantity || 0);
              return (
                <View key={d.id || d.ticket_id} style={styles.ticketRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ticketName}>
                      {d.ticket_class || "Loại vé"}
                    </Text>
                    <Text style={styles.ticketMeta}>
                      x{d.quantity} • {Number(d.price).toLocaleString("vi-VN")}{" "}
                      VND/vé
                    </Text>
                  </View>
                  <Text style={styles.ticketAmount}>
                    {Number(lineTotal).toLocaleString("vi-VN")} VND
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Card: Chọn phương thức thanh toán */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          {paymentMethods.map((pm) => {
            const selected = paymentMethod === pm.key;
            return (
              <TouchableOpacity
                key={pm.key}
                style={styles.payMethodRow}
                onPress={() => setPaymentMethod(pm.key)}
                activeOpacity={0.8}
              >
                <View style={styles.pmLeft}>
                  <Ionicons
                    name={pm.icon}
                    size={22}
                    color={selected ? "#2ecc71" : "#555"}
                  />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.pmTitle}>{pm.title}</Text>
                    {!!pm.subtitle && (
                      <Text style={styles.pmSubtitle}>{pm.subtitle}</Text>
                    )}
                  </View>
                </View>

                {/* Radio đơn giản */}
                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: selected ? "#2ecc71" : "#ccc" },
                  ]}
                >
                  {selected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Card: Lưu ý (giữ lại như yêu cầu) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Lưu ý</Text>
          <Text style={styles.note}>
            • Vé điện tử sẽ được gửi về email sau khi thanh toán thành công.
          </Text>
          <Text style={styles.note}>
            • Vui lòng kiểm tra kỹ thông tin trước khi tiếp tục.
          </Text>
          <Text style={styles.note}>
            • Cần hỗ trợ? Liên hệ CSKH để được giúp đỡ nhanh.
          </Text>
        </View>
      </ScrollView>

      {/* Footer: Tổng tiền + CTA thanh toán trong SafeArea */}
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.footerLabel}>Tổng cộng</Text>
          <Text style={styles.footerTotal}>
            {Number(totalPrice).toLocaleString("vi-VN")} VND
          </Text>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={handlePay}>
          <Ionicons name="lock-closed-outline" size={16} color="#fff" />
          <Text style={styles.primaryBtnText}>Thanh toán</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header + gradient đồng bộ với EventDetail
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },

  // Card chung
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
  muted: { color: "#7f8c8d" },

  // Rows hiển thị key-value
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  label: { fontSize: 15, color: "#555" },
  value: { fontSize: 15, fontWeight: "600", color: "#333", maxWidth: "60%" },

  // Danh sách vé
  ticketRow: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
  },
  ticketName: { fontSize: 15, fontWeight: "600", color: "#2c3e50" },
  ticketMeta: { fontSize: 13, color: "#7f8c8d", marginTop: 2 },
  ticketAmount: { fontSize: 15, fontWeight: "700", color: "#2c3e50" },

  // Phương thức thanh toán
  payMethodRow: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pmLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  pmTitle: { fontSize: 15, fontWeight: "600", color: "#2c3e50" },
  pmSubtitle: { fontSize: 12.5, color: "#7f8c8d", marginTop: 2 },

  // Radio
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2ecc71",
  },

  // Lưu ý
  note: { fontSize: 13.5, color: "#596875", lineHeight: 20, marginTop: 2 },

  // Footer + CTA
  footer: {
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerLabel: { fontSize: 12, color: "#7f8c8d" },
  footerTotal: { fontSize: 18, fontWeight: "800", color: "#09ac03ff" },
  primaryBtn: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
