// app/organizer/stats/index.js
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { authApi, endpoints } from "../../../services/api";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// Lấy kích thước màn hình
const { width: screenWidth } = Dimensions.get("window");

// Hàm helper để format số
const formatCurrency = (value) => {
  if (typeof value !== "number") return "0";
  return value.toLocaleString("vi-VN");
};

// Cập nhật hàm gọi API để lấy TẤT CẢ dữ liệu thống kê
const fetchOrganizerDashboardData = async (filters) => {
  const { data } = await authApi.get(endpoints.organizerStats, {
    params: filters,
  });
  return data;
};

const StatsScreen = () => {
  // State quản lý các giá trị của bộ lọc
  const [filters, setFilters] = useState({
    event_id: "", // "" có nghĩa là "Tất cả sự kiện"
    from: null,
    to: null,
    group_by: "day", // 'day' hoặc 'month'
  });

  // State quản lý việc hiển thị date picker
  const [showDatePicker, setShowDatePicker] = useState({
    visible: false,
    field: null, // 'from' hoặc 'to'
  });

  const [isDownloading, setIsDownloading] = useState(false);

  // SỬ DỤNG MỘT useQuery DUY NHẤT để lấy tất cả dữ liệu
  const {
    data: dashboardData,
    isLoading, // Sử dụng một trạng thái loading chung
    isError,
    error,
  } = useQuery({
    queryKey: ["organizerDashboard", filters], // Đổi queryKey cho rõ nghĩa
    queryFn: () => fetchOrganizerDashboardData(filters),
  });

  // Tách dữ liệu ra từ dashboardData để dễ sử dụng
  const stats = {
    totals: dashboardData?.totals,
    series: dashboardData?.series,
  };
  const events = dashboardData?.events || []; // Lấy danh sách events từ response

  // Hàm xử lý khi nhấn nút Xuất Báo Cáo
  const handleExportPdf = async () => {
    // Kiểm tra xem đã chọn sự kiện chưa
    if (!filters.event_id) {
      Alert.alert("Thông báo", "Vui lòng chọn một sự kiện để xuất báo cáo.");
      return;
    }

    setIsDownloading(true); // Bắt đầu tải

    try {
      const token = await getToken(); // Lấy token xác thực
      const selectedEvent = events.find((e) => e.id === filters.event_id);
      const eventName = selectedEvent
        ? selectedEvent.name.replace(/\s/g, "_")
        : "event";
      const fileName = `BaoCao_${eventName}_${moment().format("YYYYMMDD")}.pdf`;

      // Tạo chuỗi query params cho from và to date
      const queryParams = new URLSearchParams();
      if (filters.from) queryParams.append("from", filters.from);
      if (filters.to) queryParams.append("to", filters.to);

      // URL của API để tải file PDF
      const url = `${endpoints.base}/${endpoints.events}${
        filters.event_id
      }/export-pdf/?${queryParams.toString()}`;

      // Đường dẫn file cục bộ trên thiết bị
      const fileUri = FileSystem.documentDirectory + fileName;

      // Dùng FileSystem để tải file
      const { uri } = await FileSystem.downloadAsync(url, fileUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Sau khi tải xong, dùng Sharing để mở hộp thoại lưu/chia sẻ file
      await Sharing.shareAsync(uri, {
        dialogTitle: "Lưu hoặc chia sẻ báo cáo",
        mimeType: "application/pdf",
      });
    } catch (err) {
      console.error("Lỗi khi xuất PDF:", err);
      Alert.alert("Lỗi", "Không thể xuất file PDF. Vui lòng thử lại.");
    } finally {
      setIsDownloading(false); // Kết thúc tải
    }
  };

  // Hàm xử lý khi thay đổi giá trị của bộ lọc
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Hàm xử lý khi chọn ngày từ DateTimePicker
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || filters[showDatePicker.field];
    setShowDatePicker({ visible: false, field: null });
    if (currentDate) {
      handleFilterChange(
        showDatePicker.field,
        moment(currentDate).format("YYYY-MM-DD")
      );
    }
  };

  // Dữ liệu cho biểu đồ
  const chartData = {
    labels:
      stats?.series?.map((item) =>
        moment(item.period).format(
          filters.group_by === "day" ? "DD/MM" : "MM/YY"
        )
      ) || [],
    datasets: [
      {
        data: stats?.series?.map((item) => item.revenue) || [],
        color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // Màu đỏ cho doanh thu
        strokeWidth: 2,
      },
    ],
    legend: ["Doanh thu (VND)"],
  };

  return (
    <LinearGradient
      colors={["#ffbde7ff", "#b7f7ffff"]}
      style={styles.gradientBackground}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Thống Kê - Báo Cáo</Text>
          </View>

          {/* --- KHU VỰC THỐNG KÊ TỔNG QUAN --- */}
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#00aaff"
              style={{ marginTop: 20 }}
            />
          ) : (
            <View style={styles.summaryContainer}>
              <View style={styles.statCard}>
                <Ionicons name="cash-outline" size={24} color="#28a745" />
                <Text style={styles.statLabel}>Tổng Doanh Thu</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(stats?.totals?.revenue)} VND
                </Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="ticket-outline" size={24} color="#17a2b8" />
                <Text style={styles.statLabel}>Vé Đã Bán</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(stats?.totals?.tickets_sold)}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color="#ffc107"
                />
                <Text style={styles.statLabel}>Đã Check-in</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(stats?.totals?.checked_in)}
                </Text>
              </View>
            </View>
          )}

          {/* --- KHU VỰC BỘ LỌC --- */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterTitle}>Bộ lọc</Text>

            {/* Lọc theo sự kiện */}
            <Picker
              selectedValue={filters.event_id}
              onValueChange={(itemValue) =>
                handleFilterChange("event_id", itemValue)
              }
              style={styles.picker}
              enabled={!isLoading} // Vô hiệu hóa picker khi đang tải
            >
              <Picker.Item
                label={isLoading ? "Đang tải sự kiện..." : "Tất cả sự kiện"}
                value=""
              />
              {events.map((event) => (
                <Picker.Item
                  key={event.id}
                  label={event.name}
                  value={event.id}
                />
              ))}
            </Picker>

            {/* Lọc theo ngày */}
            <View style={styles.dateFilterRow}>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() =>
                  setShowDatePicker({ visible: true, field: "from" })
                }
              >
                <Text>
                  {filters.from
                    ? `Từ: ${moment(filters.from).format("DD/MM/YYYY")}`
                    : "Từ ngày"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() =>
                  setShowDatePicker({ visible: true, field: "to" })
                }
              >
                <Text>
                  {filters.to
                    ? `Đến: ${moment(filters.to).format("DD/MM/YYYY")}`
                    : "Đến ngày"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Lọc nhóm theo ngày/tháng */}
            <View style={styles.groupFilterRow}>
              <TouchableOpacity
                style={[
                  styles.groupButton,
                  filters.group_by === "day" && styles.groupButtonActive,
                ]}
                onPress={() => handleFilterChange("group_by", "day")}
              >
                <Text
                  style={
                    filters.group_by === "day"
                      ? styles.groupButtonTextActive
                      : styles.groupButtonText
                  }
                >
                  Theo Ngày
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.groupButton,
                  filters.group_by === "month" && styles.groupButtonActive,
                ]}
                onPress={() => handleFilterChange("group_by", "month")}
              >
                <Text
                  style={
                    filters.group_by === "month"
                      ? styles.groupButtonTextActive
                      : styles.groupButtonText
                  }
                >
                  Theo Tháng
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker.visible && (
              <DateTimePicker
                value={
                  filters[showDatePicker.field]
                    ? new Date(filters[showDatePicker.field])
                    : new Date()
                }
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            <TouchableOpacity
              style={[
                styles.exportButton,
                (!filters.event_id || isDownloading) && styles.buttonDisabled,
              ]}
              onPress={handleExportPdf}
              disabled={!filters.event_id || isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.exportButtonText}>Xuất Báo Cáo PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* --- KHU VỰC BIỂU ĐỒ --- */}
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Biểu đồ Doanh Thu</Text>
            {isLoading ? (
              <ActivityIndicator color="#00aaff" />
            ) : isError ? (
              <Text style={styles.errorText}>Lỗi: {error.message}</Text>
            ) : stats?.series?.length > 0 ? (
              <LineChart
                data={chartData}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            ) : (
              <Text style={styles.noDataText}>
                Không có dữ liệu để hiển thị.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// Config cho biểu đồ
const chartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 170, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "#00aaff",
  },
};

// CSS cho màn hình
const styles = StyleSheet.create({
  gradientBackground: { flex: 1 },
  container: { flex: 1, backgroundColor: "transparent" },
  scrollContainer: { paddingBottom: 20 },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    width: "30%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statLabel: { fontSize: 14, color: "#666", marginTop: 8 },
  statValue: { fontSize: 16, fontWeight: "bold", marginTop: 4, color: "#000" },
  filterContainer: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  filterTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  picker: {
    width: "100%",
    height: 50,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 10,
  },
  dateFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  groupFilterRow: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#e9ecef",
    borderRadius: 8,
  },
  groupButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  groupButtonActive: {
    backgroundColor: "#00aaff",
    borderRadius: 8,
  },
  groupButtonText: {
    color: "#333",
  },
  groupButtonTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  chartContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
  },
  chartTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  chart: { marginVertical: 8, borderRadius: 16 },
  errorText: { color: "red", textAlign: "center" },
  noDataText: { color: "#666", textAlign: "center", padding: 20 },
  exportButton: {
    flexDirection: "row",
    backgroundColor: "#007bff", // Màu xanh dương
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15, // Thêm khoảng cách
  },
  exportButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: "#a0c8f0", // Màu nhạt hơn khi bị vô hiệu hóa
  },
});

export default StatsScreen;
