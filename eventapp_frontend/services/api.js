// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import qs from 'qs'; // Thư viện để chuyển đổi object thành form-urlencoded


// Base URL của backend
const BASE_URL = 'https://eventapp-production-bcaa.up.railway.app/';

export const CLOUD_BASE_URL = "https://res.cloudinary.com/dachbxwws/";

// Danh sách các endpoints
export const endpoints = {
    'login': '/o/token/',
    'registerAttendee': '/api/users/register/',
    'registerOrganizer': '/api/organizers/',
    'googleLogin': '/api/firebase-login/',
    'currentUser': '/api/users/current-user/', 
};

// Client ID và Client Secret từ backend
const CLIENT_ID = 'INuD9I5SADMpikgGPfdgZeYKdu1NncPKrDs7b70l';
const CLIENT_SECRET = 'DjFi2UJC1VpacmEdA2KngGZUWAHxEBY2Ek6reKahAhT3ckau7mR5fQY3Lg0PFDKTmEPGScHJR3CiVCmH7UxwOe0odSwuJ4IKqxLb7r9e2PiYIYIHyHNJ4frH7RpRqaEL';

  /**
   * Hàm xin access token mới bằng refresh token
   */
  export const refreshAccessToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh-token');
      if (!refreshToken) return null;

      const data = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      };

      const response = await axios.post(
        `${BASE_URL}${endpoints.login}`,
        qs.stringify(data),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      // Lưu lại token mới
      await AsyncStorage.setItem('access-token', response.data.access_token);
      await AsyncStorage.setItem('refresh-token', response.data.refresh_token);

      return response.data.access_token;
    } catch (error) {
      console.log('Refresh token failed:', error.response?.data || error.message);
      return null;
    }
  };

/**
 * Tạo một instance axios cho các API không cần xác thực.
 */
export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 5000,
});

/**
 * Tạo một instance axios cho các API cần xác thực.
 * Instance này sẽ tự động đính kèm Access Token vào header của mỗi request.
 */
export const authApi = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

// Interceptor cho authApi: tự động gắn token và refresh khi hết hạn
authApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu token hết hạn (401) và chưa retry thì gọi refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return authApi(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
