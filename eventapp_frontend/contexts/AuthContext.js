// contexts/AuthContext.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { createContext, useEffect, useState } from "react";
import { authApi, endpoints } from "../services/api";

// Tạo context để chia sẻ trạng thái user toàn cục
export const AuthContext = createContext();

// children là prop đại diện cho các component con bên trong AuthProvider
export const AuthProvider = ({ children }) => {
  // user lưu thông tin người dùng (role, email, ...)
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Khi app khởi động → lấy token từ AsyncStorage và fetch user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await AsyncStorage.getItem("access-token");
        if (token) {
          authApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const res = await authApi.get(endpoints.currentUser);
          console.log("Fetch user sau login:", res.data);
          console.log("Role của user:", res.data.role);  
          setUser(res.data);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Load user error:", err.response?.data || err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Hàm login → lưu token + fetch user
  const login = async (accessToken, refreshToken) => {
    await AsyncStorage.setItem("access-token", accessToken);
    await AsyncStorage.setItem("refresh-token", refreshToken);

    authApi.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    
    try {
      const res = await authApi.get(endpoints.currentUser);
      setUser(res.data);
    } catch (err) {
      console.error(
        "Login fetch user error:",
        err.response?.data || err.message
      );
      setUser(null);
    }
  };

  // Hàm logout → xóa token + reset user
  const logout = async () => {
    await AsyncStorage.removeItem("access-token");
    await AsyncStorage.removeItem("refresh-token");
    setUser(null);
    delete authApi.defaults.headers.common["Authorization"];
    router.replace("/welcome");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
