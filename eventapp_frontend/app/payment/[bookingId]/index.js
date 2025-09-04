import { Ionicons } from "@expo/vector-icons"; // Icon từ thư viện Ionicons
import { LinearGradient } from "expo-linear-gradient"; // Gradient nền
import { useLocalSearchParams, useRouter } from "expo-router"; // Hook lấy params & điều hướng
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, // Thành phần hiển thị loading spinner
  SafeAreaView, // View an toàn tránh bị che bởi notch hoặc status bar
  StyleSheet, // Tùy chỉnh style cho React Native
  Text, // Thành phần hiển thị văn bản
  TouchableOpacity, // Nút có thể nhấn được
  View, // Thành phần container cơ bản
} from "react-native";
import { WebView } from "react-native-webview"; // WebView hiển thị trang web
import { authApi } from "../../../services/api"; // API gọi backend

// Hàm parse query params từ URL
const parseQueryParams = (urlString) => {
  let url;
  try {
    url = new URL(urlString); // Tạo URL object
  } catch {
    return {}; // Nếu sai định dạng trả về rỗng
  }
  const params = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value; // Lưu key/value vào object
  });
  return params;
};

export default function PaymentScreen() {
  const { bookingId, method } = useLocalSearchParams(); // Lấy bookingId và phương thức thanh toán
  const router = useRouter(); // Hook điều hướng
  const [paymentUrl, setPaymentUrl] = useState(null); // URL VNPAY
  const [paypalUrl, setPaypalUrl] = useState(null); // URL PayPal
  const [loading, setLoading] = useState(true); // Loading state
  const webRef = useRef(null); // Ref cho WebView
  const [booking, setBooking] = useState(null); // State lưu thông tin booking
  // State lưu thông báo lỗi thanh toán
  const [paymentError, setPaymentError] = useState(null);

  const [gateway, setGateway] = useState(method || "vnpay"); // Chọn gateway

  // Hàm init VNPAY
  const initVnpay = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await authApi.post(`api/bookings/${bookingId}/vnpay_init/`); // API backend VNPAY
      setPaymentUrl(res?.data?.payment_url); // Lấy payment_url
    } catch (e) {
      await fakePaymentSuccess(); // Nếu lỗi fallback fake payment
    } finally {
      setLoading(false);
    }
  }, [bookingId, router]);

  // Hàm init PayPal
  const initPaypal = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await authApi.post(
        `api/bookings/${bookingId}/paypal_create/`
      ); // API backend PayPal
      const approveUrl = res?.data?.approve_url;
      if (approveUrl) {
        setPaypalUrl(approveUrl); // Lưu approve_url
      }
    } catch (e) {
      console.log("PayPal init error:", e);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  // Fake payment nếu VNPAY lỗi
  const fakePaymentSuccess = async () => {
    try {
      await authApi.post(`api/bookings/${bookingId}/fake_payment/`); // API fake payment
      fetchBookingStatus(); // Lấy trạng thái booking từ backend và update state
    } catch (e) {
      console.log("Fake payment failed:", e); // Log lỗi
      // Thêm state báo lỗi để render thông báo
      setPaymentError("Thanh toán giả lập thất bại. Vui lòng thử lại.");
    }
  };

  // Chạy init khi mount hoặc bookingId thay đổi
  useEffect(() => {
    if (gateway === "vnpay") {
      initVnpay();
    } else if (gateway === "paypal") {
      initPaypal();
    }
  }, [gateway, bookingId]);

  useEffect(() => {
    if (booking?.status === "paid") {
      router.replace(`/result?bookingId=${booking.id}&status=success`);
    }
  }, [booking?.status]);

  // Hàm fetch trạng thái booking từ backend
  const fetchBookingStatus = async () => {
    try {
      const res = await authApi.get(`api/bookings/${bookingId}/`);
      setBooking(res.data); // lưu trạng thái booking vào state
    } catch (e) {
      console.log("Lỗi fetch booking:", e);
    }
  };

  // WebView intercept VNPAY URL
  const handleShouldStart = useCallback(
    (request) => {
      const { url } = request || {};
      if (!url) {
        return true; // Allow navigation if URL is missing
      }

      // --- VNPAY LOGIC ---
      // Check if the URL is a VNPAY return URL
      if (gateway === "vnpay" && url.includes("vnp_ResponseCode=")) {
        console.log(">>> VNPAY return detected, navigating to result...");
        // Điều hướng ngay lập tức cho VNPAY vì không cần bước capture
        router.replace(`/payment/result?bookingId=${bookingId}`);
        return false; // Chặn WebView load tiếp
      }
      // --- PAYPAL LOGIC: webview load bình thường ---
      return true;
    },
    // Add all dependencies that the function uses from the component's scope
    [gateway, bookingId, router]
  );

  // Render loading
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.whiteTop} />
        <LinearGradient
          colors={["#ffbde7ff", "#b7f7ffff"]}
          style={styles.gradientBottom}
        >
          <SafeAreaView style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.note}>
              {gateway === "vnpay"
                ? "Đang khởi tạo VNPAY..."
                : "Đang khởi tạo PayPal..."}
            </Text>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // Render lỗi nếu URL null
  if (gateway === "vnpay" && !paymentUrl) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Không thể mở trang thanh toán VNPAY</Text>
        <TouchableOpacity style={styles.buyButton} onPress={initVnpay}>
          <Text style={styles.buyButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (gateway === "paypal" && !paypalUrl) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.note}>Đang khởi tạo PayPal...</Text>
      </SafeAreaView>
    );
  }

  // Render WebView
  return (
    <LinearGradient
      colors={["#ffbde7ff", "#b7f7ffff"]}
      style={styles.container}
    >
      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000000ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {gateway === "vnpay" ? "Thanh toán VNPAY" : "Thanh toán PayPal"}
          </Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      {/* WebView container */}
      <SafeAreaView style={styles.webContainer}>
        {/* Hiển thị lỗi nếu có */}
        {paymentError && (
          <Text style={{ color: "red", marginVertical: 8 }}>
            {paymentError}
          </Text>
        )}

        <WebView
          ref={webRef}
          source={{ uri: gateway === "vnpay" ? paymentUrl : paypalUrl }}
          originWhitelist={["*"]}
          // enable support for redirects
          javaScriptEnabled

          
          onShouldStartLoadWithRequest={handleShouldStart}
          onNavigationStateChange={(navState) => {
            const { url } = navState;
            if (!url) return;

            // Chỉ thực hiện khi gateway là PayPal và URL chứa đường dẫn trả về
            if (gateway === "paypal" && url.includes("/api/paypal_return/")) {
              console.log(
                ">>> WebView has loaded the return URL. Backend process is complete."
              );
              console.log(">>> Navigating to result screen now.");

              router.replace(`/payment/result?bookingId=${bookingId}`);
            }
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerContainer: { backgroundColor: "transparent", marginTop: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  webContainer: { flex: 1 },
  loadingContainer: { flex: 1 },
  whiteTop: { flex: 0.5, backgroundColor: "#fff" },
  gradientBottom: { flex: 0.5 },
  loadingOverlay: { flex: 1, alignItems: "center", justifyContent: "center" },
  note: { marginTop: 8, color: "#666" },
  error: { marginBottom: 16, color: "#c00", fontWeight: "700" },
  buyButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "80%",
  },
  buyButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  gatewayRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 12,
    gap: 10,
  },
  gatewayBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#eee",
  },
  active: { backgroundColor: "#2ecc71" },
  gatewayText: { fontWeight: "600", color: "#000" },
});
