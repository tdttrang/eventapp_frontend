import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { authApi } from "../../services/api"; 

export default function OrganizerProfile() {
  // State được giữ nguyên từ file Profile của attendee
  const { user, fetchUser, logout } = useAuth(); // Lấy user và hàm fetchUser từ context
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ username: "", email: "" });
  const [avatarMenuVisible, setAvatarMenuVisible] = useState(false);
  const [viewImageVisible, setViewImageVisible] = useState(false);

  // State mới để quản lý nút yêu cầu cấp quyền
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const placeholderAvatar =
    "https://res.cloudinary.com/dm9d5x14u/image/upload/v1698758863/images/default_avatar.png";

  // Hàm load thông tin user ban đầu
  const loadInitialData = async () => {
    setLoading(true);
    if (!user) {
      await fetchUser(); // Gọi hàm fetchUser từ context nếu user chưa có
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Cập nhật form sửa đổi khi thông tin user thay đổi
  useEffect(() => {
    if (user) {
      setEditData({ username: user.username, email: user.email });
    }
  }, [user]);

  // Hàm mới: Gọi API xin cấp quyền từ backend
  const handleRequestApproval = async () => {
    setIsRequesting(true);
    try {
      // Endpoint này đã được tạo ở backend
      await authApi.post("/api/organizers/request-approval/");
      Alert.alert(
        "Thành công",
        "Yêu cầu của bạn đã được gửi đến quản trị viên. Vui lòng chờ duyệt."
      );
      setRequestSent(true); // Vô hiệu hóa nút sau khi gửi thành công
    } catch (error) {
      console.error(
        "Lỗi khi gửi yêu cầu:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Lỗi",
        error.response?.data?.detail ||
          "Không thể gửi yêu cầu. Vui lòng thử lại."
      );
    } finally {
      setIsRequesting(false);
    }
  };

  // Các hàm còn lại giữ nguyên logic
  const handleHelpCenter = () => Linking.openURL("https://www.google.com/");

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Quyền bị từ chối",
        "Cần cấp quyền truy cập ảnh để thay đổi avatar"
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      const formData = new FormData();
      formData.append("avatar", {
        uri: result.assets[0].uri,
        name: `avatar_${Date.now()}.jpg`,
        type: "image/jpeg",
      });
      try {
        await authApi.post("/api/users/me/avatar/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        fetchUser(); // Cập nhật lại thông tin user từ context
        Alert.alert("Thành công", "Cập nhật ảnh đại diện thành công!");
      } catch (err) {
        console.error(
          "Lỗi khi upload avatar:",
          err.response?.data || err.message
        );
        Alert.alert("Lỗi", "Không thể cập nhật ảnh đại diện.");
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      await authApi.patch("/api/users/me/", editData);
      fetchUser(); // Cập nhật lại thông tin user từ context
      setIsEditing(false);
      Alert.alert("Thành công", "Cập nhật thông tin thành công!");
    } catch (err) {
      console.error(
        "Lỗi khi cập nhật thông tin:",
        err.response?.data || err.message
      );
      Alert.alert("Lỗi", "Không thể cập nhật thông tin.");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Xác nhận đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất không?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Đăng xuất", onPress: logout },
      ]
    );
  };

  if (loading || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6347" />
        <Text style={{ marginTop: 10, color: "#888" }}>
          Đang tải thông tin...
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#ffbde7ff", "#b7f7ffff"]} style={{ flex: 1 }}>
          <SafeAreaView edges={["top"]} style={styles.header}>
            <Text style={[styles.headerTitle, { color: "#024430ff" }]}>
              Hồ sơ của tôi
            </Text>
          </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View>
          <Image
            source={{ uri: "https://picsum.photos/800/300" }}
            style={{ width: "100%", height: 170, opacity: 0.8 }}
          />
          <View style={{ alignItems: "center", marginTop: -50 }}>
            <TouchableOpacity onPress={() => setAvatarMenuVisible(true)}>
              <Image
                key={user.avatar}
                source={{
                  uri: `${user.avatar || placeholderAvatar}?t=${Date.now()}`,
                }}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileHeader}>
          {!isEditing ? (
            <Text style={styles.username}>{user.username}</Text>
          ) : (
            <TextInput
              style={[styles.username, styles.input]}
              value={editData.username}
              onChangeText={(text) =>
                setEditData({ ...editData, username: text })
              }
              placeholder="Tên người dùng"
            />
          )}
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trạng thái nhà tổ chức</Text>
          {user.is_approved ? (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
              <Text style={[styles.statusText, { color: "#27ae60" }]}>
                Tài khoản đã được duyệt
              </Text>
            </View>
          ) : (
            <View>
              <View style={styles.statusContainer}>
                <Ionicons name="alert-circle" size={24} color="#f39c12" />
                <Text style={[styles.statusText, { color: "#f39c12" }]}>
                  Tài khoản đang chờ duyệt
                </Text>
              </View>
              <Text style={styles.statusDescription}>
                Bạn cần được quản trị viên duyệt để có thể tạo và quản lý sự
                kiện.
              </Text>
              <TouchableOpacity
                style={[
                  styles.requestButton,
                  (isRequesting || requestSent) && styles.disabledButton,
                ]}
                onPress={handleRequestApproval}
                disabled={isRequesting || requestSent}
              >
                {isRequesting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.requestButtonText}>
                    {requestSent ? "Đã gửi yêu cầu" : "Yêu cầu cấp quyền"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setIsEditing(!isEditing)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons
                name={
                  isEditing ? "close-circle-outline" : "person-circle-outline"
                }
                size={24}
                color="#FF6347"
              />
              <Text style={styles.menuItemText}>
                {isEditing ? "Hủy" : "Chỉnh sửa hồ sơ"}
              </Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color="#888" />
          </TouchableOpacity>
          {isEditing && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSaveProfile}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name="save-outline" size={24} color="#27ae60" />
                <Text style={styles.menuItemText}>Lưu thay đổi</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ứng dụng</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleHelpCenter}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#f1c40f" />
              <Text style={styles.menuItemText}>Trung tâm trợ giúp</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={24} color="#888" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODALS */}
      <Modal
        transparent
        visible={avatarMenuVisible}
        animationType="fade"
        onRequestClose={() => setAvatarMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setAvatarMenuVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setAvatarMenuVisible(false);
                if (user.avatar) setViewImageVisible(true);
              }}
            >
              <Text style={styles.modalItemText}>Xem ảnh đại diện</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setAvatarMenuVisible(false);
                pickImage();
              }}
            >
              <Text style={styles.modalItemText}>Thay đổi ảnh đại diện</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalItem, { borderBottomWidth: 0 }]}
              onPress={() => setAvatarMenuVisible(false)}
            >
              <Text style={[styles.modalItemText, { color: "red" }]}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={viewImageVisible}
        transparent={true}
        onRequestClose={() => setViewImageVisible(false)}
      >
        <View style={styles.viewImageContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setViewImageVisible(false)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: `${user.avatar}?t=${Date.now()}` }}
            style={styles.fullScreenImage}
          />
        </View>
      </Modal>
    </LinearGradient>
  );
}

// Các style được tinh chỉnh lại một chút cho đẹp hơn
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  header: {
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#333" },
  profileHeader: { alignItems: "center", paddingVertical: 10 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#fff",
    elevation: 5,
  },
  username: { fontSize: 24, fontWeight: "bold", marginTop: 10, color: "#333" },
  email: { fontSize: 16, color: "#666", marginTop: 5 },
  input: {
    borderBottomWidth: 1,
    borderColor: "#FF6347",
    paddingBottom: 5,
    textAlign: "center",
    width: 200,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 15,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#444",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  menuItemLeft: { flexDirection: "row", alignItems: "center" },
  menuItemText: { fontSize: 16, marginLeft: 15, color: "#333" },
  logoutButton: {
    backgroundColor: "#e74c3c",
    marginHorizontal: 100,
    marginTop: 25,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    elevation: 3,
  },
  logoutButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  statusText: { fontSize: 16, marginLeft: 10, fontWeight: "600" },
  statusDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    marginBottom: 15,
    lineHeight: 20,
  },
  requestButton: {
    backgroundColor: "#FF6347",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    elevation: 3,
  },
  requestButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  disabledButton: { backgroundColor: "#bdc3c7" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    width: 280,
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalItemText: { fontSize: 16, textAlign: "center" },
  viewImageContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: { position: "absolute", top: 50, right: 20, zIndex: 1 },
  fullScreenImage: { width: "100%", height: "80%", resizeMode: "contain" },
});
