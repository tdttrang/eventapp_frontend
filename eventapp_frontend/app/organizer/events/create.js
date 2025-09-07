// app/organizer/events/create.js
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Yup from "yup";
import { authApi } from "../../../services/api";

// --- Schema Validation dùng Yup ---
const CreateEventSchema = Yup.object().shape({
  name: Yup.string().required("Tên sự kiện là bắt buộc"),
  description: Yup.string().required("Mô tả là bắt buộc"),
  location: Yup.string().required("Địa điểm là bắt buộc"),
  category: Yup.string().required("Danh mục là bắt buộc"),
  date: Yup.date()
    .required("Ngày diễn ra là bắt buộc")
    .min(new Date(), "Ngày diễn ra phải ở trong tương lai"),
  tickets: Yup.array()
    .of(
      Yup.object().shape({
        ticket_class: Yup.string().required("Tên loại vé là bắt buộc"),
        price: Yup.number()
          .required("Giá vé là bắt buộc")
          .min(0, "Giá vé không hợp lệ"),
        quantity: Yup.number()
          .required("Số lượng là bắt buộc")
          .min(1, "Số lượng phải lớn hơn 0"),
      })
    )
    .min(1, "Phải có ít nhất một loại vé"),
});

// --- Component chính ---
export default function CreateEventScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [images, setImages] = useState([]); // Lưu các URI của ảnh được chọn
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // --- Logic Upload Ảnh lên Cloudinary ---
  const uploadImageToCloudinary = async (uri) => {
    const formData = new FormData();
    formData.append("file", {
      uri,
      type: "image/jpeg",
      name: "event-image.jpg",
    });
    formData.append("upload_preset", "eventapp_unsigned"); // Preset không cần chữ ký

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload",
        {
          // <-- THAY YOUR_CLOUD_NAME
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      return data.secure_url; // Trả về URL an toàn
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      return null;
    }
  };

  // --- Dùng useMutation để xử lý việc gọi API tạo sự kiện ---
  const mutation = useMutation({
    mutationFn: async (formData) => {
      return authApi.post("/api/events/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      // Khi thành công, làm mới lại danh sách sự kiện và quay về
      queryClient.invalidateQueries(["organizerEvents"]);
      Alert.alert("Thành công", "Sự kiện của bạn đã được tạo.");
      router.back();
    },
    onError: (error) => {
      console.error("Create Event Error:", error);
      Alert.alert("Thông báo", "Đã có lỗi xảy ra. Vui lòng thử lại.");
    },
  });

  // --- Hàm xử lý chọn ảnh từ thư viện ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImages(result.assets.map((asset) => asset.uri));
    }
  };

  // --- Hàm xử lý submit form ---
  const handleCreateEvent = async (values) => {
    // 1. Upload ảnh lên Cloudinary
    const imageUrls = await Promise.all(
      images.map((uri) => uploadImageToCloudinary(uri))
    );
    const validImageUrls = imageUrls.filter((url) => url !== null);

    // 2. Tạo FormData để gửi lên backend
    const formData = new FormData();
    Object.keys(values).forEach((key) => {
      if (key === "tickets" || key === "media") {
        // bỏ qua
      } else if (key === "date") {
        formData.append(key, values[key].toISOString());
      } else {
        formData.append(key, values[key]);
      }
    });

    // Thêm tickets và media vào formData
    // Backend DRF đọc nested JSON qua stringify
    formData.append("tickets", JSON.stringify(values.tickets));
    if (validImageUrls.length > 0) {
      formData.append(
        "media",
        JSON.stringify(
          validImageUrls.map((url) => ({ file: url, type: "image" }))
        )
      );
    }

    // 3. Gọi mutation
    mutation.mutate(formData);
  };

  return (
    <LinearGradient colors={["#ffbde7", "#b7f7ff"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#004D40" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tạo sự kiện mới</Text>
            <View style={{ width: 24 }} />
          </View>

          <Formik
            initialValues={{
              name: "",
              description: "",
              location: "",
              category: "",
              date: new Date(),
              tickets: [{ ticket_class: "", price: "", quantity: "" }],
            }}
            validationSchema={CreateEventSchema}
            onSubmit={handleCreateEvent}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              touched,
              setFieldValue,
            }) => (
              <ScrollView contentContainerStyle={styles.formContainer}>
                <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>

                {/* Tên sự kiện */}
                <TextInput
                  style={styles.input}
                  placeholder="Tên sự kiện của bạn"
                  placeholderTextColor="#777"
                  value={values.name}
                  onChangeText={handleChange("name")}
                  onBlur={handleBlur("name")}
                />
                {touched.name && errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}

                {/* Mô tả */}
                <TextInput
                  style={[styles.input, { height: 100 }]}
                  placeholder="Mô tả chi tiết về sự kiện..."
                  placeholderTextColor="#777"
                  value={values.description}
                  onChangeText={handleChange("description")}
                  onBlur={handleBlur("description")}
                  multiline
                />
                {touched.description && errors.description && (
                  <Text style={styles.errorText}>{errors.description}</Text>
                )}

                {/* Địa điểm */}
                <TextInput
                  style={styles.input}
                  placeholder="Địa điểm tổ chức"
                  placeholderTextColor="#777"
                  value={values.location}
                  onChangeText={handleChange("location")}
                  onBlur={handleBlur("location")}
                />
                {touched.location && errors.location && (
                  <Text style={styles.errorText}>{errors.location}</Text>
                )}

                {/* Danh mục */}
                <TextInput
                  style={styles.input}
                  placeholder="Danh mục (VD: Âm nhạc, Hội thảo)"
                  placeholderTextColor="#777"
                  value={values.category}
                  onChangeText={handleChange("category")}
                  onBlur={handleBlur("category")}
                />
                {touched.category && errors.category && (
                  <Text style={styles.errorText}>{errors.category}</Text>
                )}

                <Text style={styles.sectionTitle}>Thời gian</Text>
                <View style={styles.dateTimePickerContainer}>
                  {/* Nút chọn ngày */}
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#004D40"
                    />
                    <Text style={styles.datePickerText}>
                      {values.date.toLocaleDateString("vi-VN")}
                    </Text>
                  </TouchableOpacity>
                  {/* Nút chọn giờ */}
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={20} color="#004D40" />
                    <Text style={styles.datePickerText}>
                      {values.date.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={values.date}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      // Logic chọn ngày (giữ nguyên)
                      setShowDatePicker(false);
                      if (event.type === "set" && selectedDate) {
                        // Giữ lại giờ cũ, chỉ cập nhật ngày mới
                        const newDate = new Date(values.date);
                        newDate.setFullYear(selectedDate.getFullYear());
                        newDate.setMonth(selectedDate.getMonth());
                        newDate.setDate(selectedDate.getDate());
                        setFieldValue("date", newDate);
                      }
                    }}
                  />
                )}

                {showTimePicker && (
                  <DateTimePicker
                    value={values.date}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, selectedTime) => {
                      // Logic chọn giờ
                      setShowTimePicker(false);
                      if (event.type === "set" && selectedTime) {
                        // Giữ lại ngày cũ, chỉ cập nhật giờ mới
                        const newDate = new Date(values.date);
                        newDate.setHours(selectedTime.getHours());
                        newDate.setMinutes(selectedTime.getMinutes());
                        setFieldValue("date", newDate);
                      }
                    }}
                  />
                )}
                {touched.date && errors.date && (
                  <Text style={styles.errorText}>{errors.date}</Text>
                )}

                <Text style={styles.sectionTitle}>Quản lý vé</Text>
                {values.tickets.map((ticket, index) => (
                  <View key={index} style={styles.ticketContainer}>
                    <TextInput
                      style={styles.ticketInput}
                      placeholder={`Loại vé ${index + 1}`}
                      placeholderTextColor="#777"
                      value={ticket.ticket_class}
                      onChangeText={handleChange(
                        `tickets[${index}].ticket_class`
                      )}
                      onBlur={handleBlur(`tickets[${index}].ticket_class`)}
                    />
                    <TextInput
                      style={styles.ticketInput}
                      placeholder="Giá (VND)"
                      placeholderTextColor="#777"
                      value={ticket.price}
                      onChangeText={handleChange(`tickets[${index}].price`)}
                      onBlur={handleBlur(`tickets[${index}].price`)}
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={styles.ticketInput}
                      placeholder="Số lượng"
                      placeholderTextColor="#777"
                      value={ticket.quantity}
                      onChangeText={handleChange(`tickets[${index}].quantity`)}
                      onBlur={handleBlur(`tickets[${index}].quantity`)}
                      keyboardType="numeric"
                    />
                    {/* Nút xóa vé */}
                    {values.tickets.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeTicketButton}
                        onPress={() => {
                          const newTickets = [...values.tickets];
                          newTickets.splice(index, 1);
                          setFieldValue("tickets", newTickets);
                        }}
                      >
                        <Ionicons
                          name="trash-bin-outline"
                          size={20}
                          color="#e74c3c"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {touched.tickets && typeof errors.tickets === "string" && (
                  <Text style={styles.errorText}>{errors.tickets}</Text>
                )}

                {/* Nút thêm loại vé */}
                <TouchableOpacity
                  style={styles.addTicketButton}
                  onPress={() =>
                    setFieldValue("tickets", [
                      ...values.tickets,
                      { ticket_class: "", price: "", quantity: "" },
                    ])
                  }
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addTicketButtonText}>Thêm loại vé</Text>
                </TouchableOpacity>

                {/* Nút Submit */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Tạo sự kiện</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </Formik>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- StyleSheet ---
// Thay thế toàn bộ StyleSheet cũ
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#004D40",
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#004D40",
    marginTop: 20,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#00796B",
    paddingLeft: 8,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 5,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 12,
    marginBottom: 10,
  },
  datePickerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateTimePickerContainer: {
    flexDirection: "row",
    gap: 10,
  },
  datePickerText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  // Ticket styles
  ticketContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    position: "relative",
  },
  ticketInput: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 8,
  },
  removeTicketButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  addTicketButton: {
    flexDirection: "row",
    backgroundColor: "#00796B",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  addTicketButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "bold",
  },
  // Image styles
  imagePickerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#004D40",
    fontWeight: "600",
  },
  imagePreviewContainer: {
    marginTop: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
  removeImageButton: {
    position: "absolute",
    top: -5,
    right: 5,
    backgroundColor: "white",
    borderRadius: 12,
  },
  // Submit button
  submitButton: {
    backgroundColor: "#00796B",
    padding: 18,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 30,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
