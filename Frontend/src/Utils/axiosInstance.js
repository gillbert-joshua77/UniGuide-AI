import axios from "axios";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (req) => {
    // 1. Always get the latest token from storage inside the interceptor
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    // 2. If no token exists, just send the request (let backend handle 401)
    if (!accessToken) return req;

    try {
      // 3. Decode the token (Now we know it's a string)
      const user = jwtDecode(accessToken);
      const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1;

      if (!isExpired) {
        req.headers.Authorization = `Bearer ${accessToken}`;
        return req;
      }

      // 4. If expired, try to refresh
      const res = await axios.post(`${baseURL}auth/token/refresh/`, {
        refresh: refreshToken,
      });

      if (res.status === 200) {
        // ✅ Fix: Don't use JSON.stringify for tokens (they are already strings)
        // ✅ Fix: Make sure the key matches "accessToken"
        localStorage.setItem("accessToken", res.data.access);
        req.headers.Authorization = `Bearer ${res.data.access}`;
        return req;
      }
    } catch (error) {
      // Token refresh failed — silently continue; backend will return 401
    }

    return req;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;