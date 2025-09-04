import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { authApi } from "../../services/api";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ username: "", email: "" });
  const [avatarMenuVisible, setAvatarMenuVisible] = useState(false);
  const [viewImageVisible, setViewImageVisible] = useState(false);
  
  const placeholderAvatar =
    "https://res.cloudinary.com/dm9d5x14u/image/upload/v1698758863/images/default_avatar.png";

  const handleHelpCenter = () => {
    Linking.openURL("https://www.google.com/");
  };

  const fetchUser = () => {
    setLoading(true);
    authApi
      .get("/api/users/me/")
      .then((res) => {
        setUser(res.data);
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

      authApi
        .post("/api/users/me/avatar/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => {
          setUser(res.data);
        })
        .catch((err) => {
          console.error(
            "Lỗi khi upload avatar:",
            err.response?.data || err.message
          );
        });
    }
  };

  const handleSaveProfile = () => {
    authApi
      .patch("/api/users/me/", editData)
      .then((res) => {
        setUser(res.data);
        setIsEditing(false);
      })
      .catch((err) => {
        console.error(
          "Lỗi khi cập nhật thông tin:",
          err.response?.data || err.message
        );
      });
  };

  const handleLogout = () => {
    Alert.alert(
      "Xác nhận đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          onPress: async () => {
            await AsyncStorage.removeItem("access_token");
            await AsyncStorage.removeItem("refresh_token");
            router.replace("/login");
          },
        },
      ]
    );
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
        <Text style={[styles.headerTitle, { color: "#024430ff" }]}>
          Hồ sơ của tôi
        </Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Cover + Avatar */}
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

        {/* Avatar menu modal */}
        <Modal transparent visible={avatarMenuVisible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Xem ảnh đại diện */}
              <TouchableOpacity
                onPress={() => {
                  setAvatarMenuVisible(false);
                  if (user.avatar) {
                    setViewImageVisible(true); // mở modal xem ảnh trong app
                  } else {
                    Alert.alert("Thông báo", "Bạn chưa có ảnh đại diện");
                  }
                }}
              >
                <Text style={styles.modalItem}>Xem ảnh đại diện</Text>
              </TouchableOpacity>

              {/* Thay đổi ảnh đại diện */}
              <TouchableOpacity
                onPress={() => {
                  setAvatarMenuVisible(false);
                  pickImage(); // gọi hàm chọn ảnh
                }}
              >
                <Text style={styles.modalItem}>Thay đổi ảnh đại diện</Text>
              </TouchableOpacity>

              {/* Hủy */}
              <TouchableOpacity onPress={() => setAvatarMenuVisible(false)}>
                <Text style={[styles.modalItem, { color: "red" }]}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal xem ảnh đại diện */}
        <Modal visible={viewImageVisible} transparent={true}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.9)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              style={{ position: "absolute", top: 40, right: 20 }}
              onPress={() => setViewImageVisible(false)}
            >
              <Text style={{ color: "#fff", fontSize: 18 }}>Đóng</Text>
            </TouchableOpacity>

            <Image
              source={{ uri: `${user.avatar}?t=${Date.now()}` }}
              style={{ width: "90%", height: "70%", resizeMode: "contain" }}
            />
          </View>
        </Modal>

        {/* Thông tin */}
        <View style={styles.profileHeader}>
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
              <Text style={[styles.username, { color: "#333" }]}>
                {user.username}
              </Text>
              <Text style={[styles.email, { color: "#666" }]}>
                {user.email}
              </Text>
            </>
          )}
        </View>

        {/* Card thông tin */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
          {isEditing ? (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSaveProfile}
            >
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

        {/* Card ứng dụng */}
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

        {/* Nút đăng xuất */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { marginTop: 10, alignItems: "center", marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#024430ff" },
  profileHeader: { alignItems: "center", paddingVertical: 5 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#fff",
  },
  username: { fontSize: 24, fontWeight: "bold", marginTop: 5, color: "#333" },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android
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
    marginHorizontal: 100, // thu hẹp chiều ngang
    marginTop: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: 250,
  },
  modalItem: {
    fontSize: 16,
    paddingVertical: 10,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
