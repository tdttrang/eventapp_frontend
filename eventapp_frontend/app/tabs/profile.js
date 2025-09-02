import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { authApi } from "../../services/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // State để bật/tắt chế độ chỉnh sửa thông tin cá nhân
  const [isEditing, setIsEditing] = useState(false);
  // State tạm để lưu giá trị form khi chỉnh sửa
  const [editData, setEditData] = useState({ username: "", email: "" });

  const placeholderAvatar =
    "https://res.cloudinary.com/dm9d5x14u/image/upload/v1698758863/images/default_avatar.png";

  // Hàm gọi API lấy thông tin user hiện tại
  const fetchUser = () => {
    setLoading(true);
    authApi
      .get("/api/users/me/")
      .then((res) => {
        setUser(res.data);
        // Khi load user xong, set giá trị form editData = dữ liệu hiện tại
        setEditData({ username: res.data.username, email: res.data.email });
      })
      .catch((err) => {
        console.error(
          "Lỗi khi lấy thông tin người dùng:",
          err.response?.data || err.message
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Hàm đổi avatar
  const handleChangeAvatar = async () => {
    // Mở thư viện ảnh để chọn avatar mới
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
        name: "avatar.jpg",
        type: "image/jpeg",
      });

      // Gọi API upload avatar
      authApi
        .post("/api/users/me/avatar/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => {
          setUser(res.data); // backend trả về user mới với URL Cloudinary
        })
        .catch((err) => {
          console.error(
            "Lỗi khi upload avatar:",
            err.response?.data || err.message
          );
        });
    }
  };

  // Hàm lưu thông tin cá nhân sau khi chỉnh sửa
  const handleSaveProfile = () => {
    authApi
      .patch("/api/users/me/", editData)
      .then((res) => {
        setUser(res.data); // Cập nhật state user với dữ liệu mới
        setIsEditing(false); // Tắt chế độ chỉnh sửa
      })
      .catch((err) => {
        console.error(
          "Lỗi khi cập nhật thông tin:",
          err.response?.data || err.message
        );
      });
  };

  const handleLogout = () => {
    Alert.alert("Xác nhận đăng xuất", "Bạn có chắc chắn muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        onPress: () => {
          console.log("Đã xử lý đăng xuất!");
        },
      },
    ]);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2ecc71" />
        <Text style={{ marginTop: 10, color: "#888" }}>
          Đang tải thông tin cá nhân...
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={{ textAlign: "center" }}>
          Không thể tải thông tin người dùng.
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#ffbde7ff", "#b7f7ffff"]} style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ của tôi</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleChangeAvatar}>
            <Image
              source={{ uri: user.avatar || placeholderAvatar }}
              style={styles.avatar}
            />
          </TouchableOpacity>

          {isEditing ? (
            <>
              <TextInput
                style={styles.input}
                value={editData.username}
                onChangeText={(text) =>
                  setEditData({ ...editData, username: text })
                }
                placeholder="Tên người dùng"
              />
              <TextInput
                style={styles.input}
                value={editData.email}
                onChangeText={(text) =>
                  setEditData({ ...editData, email: text })
                }
                placeholder="Email"
              />
            </>
          ) : (
            <>
              <Text style={styles.username}>{user.username}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          {isEditing ? (
            <TouchableOpacity style={styles.menuItem} onPress={handleSaveProfile}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="save-outline" size={24} color="#27ae60" />
                <Text style={styles.menuItemText}>Lưu thay đổi</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setIsEditing(true)}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name="person-circle-outline"
                  size={24}
                  color="#3498db"
                />
                <Text style={styles.menuItemText}>Chỉnh sửa hồ sơ</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={24} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 16, paddingVertical: 10, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  profileHeader: { alignItems: "center", paddingVertical: 20 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#fff",
  },
  username: { fontSize: 24, fontWeight: "bold", marginTop: 10, color: "#333" },
  email: { fontSize: 16, color: "#666", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    width: 200,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  menuItemLeft: { flexDirection: "row", alignItems: "center" },
  menuItemText: { fontSize: 16, marginLeft: 10, color: "#333" },
  logoutButton: {
    backgroundColor: "#e74c3c",
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});