import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, // Thành phần hiển thị loading spinner
  SafeAreaView, // View an toàn tránh bị che bởi notch hoặc status bar
  StyleSheet, // Tùy chỉnh style cho React Native
  Text, // Thành phần hiển thị văn bản
  TouchableOpacity, // Nút có thể nhấn được
  View, // Thành phần container cơ bản
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router"; // Hook để lấy params và điều hướng
import { WebView } from "react-native-webview"; // Thành phần hiển thị trang web trong app
import { Ionicons } from "@expo/vector-icons"; // Icon từ thư viện Ionicons
import { LinearGradient } from "expo-linear-gradient"; // Gradient nền
import { authApi } from "../../services/api"; // API để gọi backend

// Hàm tiện ích để parse các tham số từ URL
const parseQueryParams = (urlString) => {
  let url;
  try {
    url = new URL(urlString); // Tạo đối tượng URL từ chuỗi
  } catch {
    return {}; // Trả về object rỗng nếu lỗi
  }
  const params = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value; // Lưu các tham số vào object
  });
  return params;
};

export default function VnpayPaymentScreen() {
  const { bookingId } = useLocalSearchParams(); // Lấy bookingId từ params URL
  const router = useRouter(); // Hook để điều hướng giữa các màn hình
  const [paymentUrl, setPaymentUrl] = useState(null); // State lưu URL thanh toán từ backend
  const [loading, setLoading] = useState(true); // State kiểm soát trạng thái loading
  const webRef = useRef(null); // Ref để điều khiển WebView

  // Hàm khởi tạo thanh toán VNPAY
  const initVnpay = useCallback(async () => {
    if (!bookingId) return; // Kiểm tra nếu không có bookingId thì thoát
    try {
      const res = await authApi.post(`api/bookings/${bookingId}/vnpay_init/`); // Gọi API để lấy URL thanh toán
      setPaymentUrl(res?.data?.payment_url); // Cập nhật URL từ response
    } catch (e) {
      await fakePaymentSuccess(); // Nếu lỗi, dùng fake payment
    } finally {
      setLoading(false); // Tắt trạng thái loading
    }
  }, [bookingId, router]);

  // Hàm giả lập thanh toán thành công
  const fakePaymentSuccess = async () => {
    try {
      await authApi.post(`api/bookings/${bookingId}/fake_payment/`); // Gọi API fake payment
      router.replace({
        // Điều hướng đến màn hình kết quả
        pathname: "/payment/result",
        params: {
          status: "success",
          bookingId: String(bookingId),
          message: "Fake payment success (VNPAY fallback)",
        },
      });
    } catch (e) {
      router.replace({
        // Điều hướng nếu fake payment thất bại
        pathname: "/payment/result",
        params: {
          status: "failed",
          bookingId: String(bookingId),
          message: "Fake payment failed",
        },
      });
    }
  };

  // Chạy initVnpay khi component mount hoặc bookingId thay đổi
  useEffect(() => {
    initVnpay(); // Gọi hàm khởi tạo
  }, [initVnpay]);

  // Hàm xử lý thay đổi điều hướng trong WebView
  const handleNavChange = useCallback(
    (navState) => {
      const { url } = navState || {}; // Lấy URL từ trạng thái điều hướng
      if (!url) return; // Thoát nếu không có URL
      const params = parseQueryParams(url); // Parse tham số từ URL
      const responseCode = params["vnp_ResponseCode"]; // Lấy mã phản hồi từ VNPAY
      if (typeof responseCode !== "undefined") {
        // Nếu có mã phản hồi
        const isSuccess = responseCode === "00"; // Kiểm tra thanh toán thành công
        const amount = params["vnp_Amount"]; // Lấy số tiền
        const txnRef = params["vnp_TxnRef"]; // Lấy mã tham chiếu merchant
        const bankCode = params["vnp_BankCode"]; // Lấy mã ngân hàng
        const transNo = params["vnp_TransactionNo"]; // Lấy mã giao dịch VNPAY
        router.replace({
          // Điều hướng đến màn hình kết quả
          pathname: "/payment/result",
          params: {
            status: isSuccess ? "success" : "failed",
            bookingId: String(bookingId),
            vnp_ResponseCode: responseCode,
            vnp_TxnRef: txnRef || "",
            vnp_TransactionNo: transNo || "",
            vnp_BankCode: bankCode || "",
            vnp_Amount: amount || "",
          },
        });
      }
    },
    [bookingId, router]
  );

  // Hàm kiểm soát khi WebView bắt đầu load request
  const handleShouldStart = useCallback(
    (request) => {
      const { url } = request || {}; // Lấy URL từ request
      if (url && url.includes("vnp_ResponseCode=")) {
        // Nếu URL chứa mã phản hồi
        handleNavChange({ url }); // Xử lý điều hướng
        return false; // Ngăn WebView load tiếp
      }
      return true; // Cho phép các điều hướng khác
    },
    [handleNavChange]
  );

  // Render trạng thái loading
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
            <Text style={styles.note}>Đang khởi tạo VNPAY...</Text>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // Render lỗi nếu không có paymentUrl
  if (!paymentUrl) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Không thể mở trang thanh toán</Text>
        <TouchableOpacity style={styles.buyButton} onPress={initVnpay}>
          <Text style={styles.buyButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Render WebView cho thanh toán
  return (
    <LinearGradient
      colors={["#ffbde7ff", "#b7f7ffff"]}
      style={styles.container}
    >
      <SafeAreaView edges={["top"]} style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000000ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán VNPAY</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.webContainer}>
        <WebView
          ref={webRef} // Reference để điều khiển WebView
          source={{ uri: paymentUrl }} // URL thanh toán từ backend
          originWhitelist={["*"]} // Cho phép tất cả nguồn
          javaScriptEnabled // Bật JavaScript
          onNavigationStateChange={handleNavChange} // Xử lý thay đổi điều hướng
          onShouldStartLoadWithRequest={handleShouldStart} // Kiểm soát load request
          startInLoadingState // Hiển thị loading khi bắt đầu
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" />
              <Text style={styles.note}>Đang tải trang thanh toán...</Text>
            </View>
          )}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

// Styles cho màn hình
const styles = StyleSheet.create({
  container: { flex: 1 }, // Container chiếm toàn màn hình
  center: { flex: 1, alignItems: "center", justifyContent: "center" }, // Căn giữa
  headerContainer: {
    backgroundColor: "transparent", // Đảm bảo gradient hiển thị
    marginTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" }, // Tiêu đề header
  webContainer: { flex: 1 }, // Container cho WebView, tránh bị che bởi viền
  loadingContainer: { flex: 1 }, // Container cho loading
  whiteTop: { flex: 0.5, backgroundColor: "#fff" }, // Nửa trên màu trắng
  gradientBottom: { flex: 0.5 }, // Nửa dưới gradient
  loadingOverlay: { flex: 1, alignItems: "center", justifyContent: "center" }, // Overlay loading
  note: { marginTop: 8, color: "#666" }, // Văn bản thông báo
  error: { marginBottom: 16, color: "#c00", fontWeight: "700" }, // Văn bản lỗi
  buyButton: {
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "80%",
  },
  buyButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" }, // Văn bản nút
});
