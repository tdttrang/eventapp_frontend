import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { authApi, CLOUD_BASE_URL } from "../../services/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function VnpayResultScreen() {
  // Lay cac param tren URL (duoc VNPAY redirect ve)
  const {
    bookingId,
    vnp_ResponseCode,
    vnp_TxnRef,
    vnp_TransactionNo,
    vnp_BankCode,
    vnp_Amount,
  } = useLocalSearchParams();

  // Hook dieu huong
  const router = useRouter();

  // State luu thong tin booking tu backend
  const [booking, setBooking] = useState(null);

  // State kiem soat trang thai loading
  const [loading, setLoading] = useState(true);

  // State dem so lan retry goi API
  const [retryCount, setRetryCount] = useState(0);

  // Ham tai thong tin booking tu backend
  const loadBooking = async () => {
    // Neu khong co bookingId thi thoat luon
    if (!bookingId) {
      setLoading(false);
      return;
    }
    try {
      // Goi API GET /api/bookings/:id/
      const res = await authApi.get(`api/bookings/${bookingId}/`);
      // Cap nhat state booking
      setBooking(res?.data || null);

      // Neu booking chua thanh toan va con duoc retry thi goi lai sau 1s
      if (res?.data?.status !== "paid" && retryCount < 5) {
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          loadBooking();
        }, 1000);
      }
    } catch (e) {
      // Neu goi API loi thi dat booking = null
      setBooking(null);

      // Thu lai neu chua vuot qua 5 lan retry
      if (retryCount < 5) {
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          loadBooking();
        }, 1000);
      }
    } finally {
      // Ket thuc loading
      setLoading(false);
    }
  };

  // Chay loadBooking khi component mount
  useEffect(() => {
    loadBooking();
  }, []);

  // Xac dinh thanh cong dua tren trang thai booking tren server
  const success = booking?.status === "paid";

  // Render khi dang loading
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.note}>
          Dang cap nhat trang thai don hang... (Thu lai {retryCount + 1}/5)
        </Text>
      </SafeAreaView>
    );
  }

  // Tinh toan so tien hien thi
  const displayAmount =
    vnp_Amount && !isNaN(Number(vnp_Amount))
      ? Number(vnp_Amount) / 100
      : undefined;

  // Render giao dien chinh
  return (
    <LinearGradient
      colors={["#ffbde7ff", "#b7f7ffff"]}
      style={styles.container}
    >
      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000000ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả thanh toán</Text>
        <View style={{ width: 24 }} />
      </SafeAreaView>

      {/* Noi dung chinh */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Trang thai thanh toan */}
        <Text style={[styles.status, success ? styles.ok : styles.fail]}>
          {success ? "Thanh toan thanh cong" : "Thanh toan that bai"}
        </Text>

        {/* Thong tin giao dich */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thong tin giao dich</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Booking ID:</Text>
            <Text style={styles.value}>{String(bookingId || "")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>VNP Response Code:</Text>
            <Text style={styles.value}>{String(vnp_ResponseCode || "")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>VNP Transaction No:</Text>
            <Text style={styles.value}>{String(vnp_TransactionNo || "")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Merchant Ref:</Text>
            <Text style={styles.value}>{String(vnp_TxnRef || "")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Bank Code:</Text>
            <Text style={styles.value}>{String(vnp_BankCode || "")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Amount (VND):</Text>
            <Text style={styles.value}>
              {typeof displayAmount === "number"
                ? displayAmount.toLocaleString("vi-VN")
                : "-"}
            </Text>
          </View>
        </View>

        {/* Thong tin don hang */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thong tin don hang</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Trang thai tren server:</Text>
            <Text style={styles.value}>
              {String(booking?.status || "unknown")}
            </Text>
          </View>
          {Array.isArray(booking?.details) && booking.details.length > 0 && (
            <>
              <Text style={[styles.label, { marginTop: 8 }]}>Chi tiet ve:</Text>
              {booking.details.map((d) => (
                <View key={d.id} style={styles.detailRow}>
                  <Text style={styles.value}>
                    {d.ticket_class} x {d.quantity}
                  </Text>
                  <Text style={styles.value}>
                    {(Number(d.price) * d.quantity).toLocaleString("vi-VN")} VND
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Ma QR neu co */}
        {booking?.qr_code && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ma QR cua ban</Text>
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

        {/* Nut hanh dong */}
        <SafeAreaView edges={["bottom"]} style={styles.actions}>
          <TouchableOpacity
            onPress={() => router.replace("/")}
            style={[styles.buyButton, styles.primary]}
          >
            <Text style={styles.buyButtonText}>Ve trang chu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.buyButton, styles.secondary]}
          >
            <Text style={[styles.buyButtonText, styles.secondaryText]}>
              Quay lai
            </Text>
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
  ok: { color: "#0a7" },
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
