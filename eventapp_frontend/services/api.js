// services/api.js
// File cấu hình axios để gọi API backend
import axios from 'axios';

// Tạo instance axios với base URL mặc định
const api = axios.create({
  baseURL: 'https://eventapp-production-bcaa.up.railway.app/api/',
  timeout: 5000, // Thời gian tối đa cho 1 request (ms)
});

export default api;