import axios from "axios";
import { jwtDecode } from "jwt-decode";
import dayjs from "dayjs";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let pendingSubscribers = [];

function subscribeTokenRefresh(cb) {
  pendingSubscribers.push(cb);
}

function onTokenRefreshed(token) {
  pendingSubscribers.forEach((cb) => cb(token));
  pendingSubscribers = [];
}

// Wait for a fresh access token, starting the refresh if none is running.
// Every caller subscribes BEFORE the refresh kicks off (or joins it while it
// is in flight), so the requesting path can never miss its own flush and hang.
function waitForTokenRefresh() {
  return new Promise((resolve) => {
    subscribeTokenRefresh(resolve);
    if (!isRefreshing) {
      isRefreshing = true;
      refreshAccessToken()
        .then((token) => {
          isRefreshing = false;
          onTokenRefreshed(token);
        })
        .catch(() => {
          isRefreshing = false;
          onTokenRefreshed(null);
        });
    }
  });
}

function clearAuth() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("uniguide_user_name");
  localStorage.removeItem("uniguide_user_email");
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    clearAuth();
    return null;
  }
  try {
    const res = await axios.post(`${baseURL}auth/token/refresh/`, {
      refresh: refreshToken,
    });
    const newAccess = res.data.access;
    localStorage.setItem("accessToken", newAccess);
    return newAccess;
  } catch {
    clearAuth();
    return null;
  }
}

// ─── Request interceptor: attach a valid access token ───────────────
axiosInstance.interceptors.request.use(async (req) => {
  // Let the browser set Content-Type with the correct boundary for file uploads.
  if (req.data instanceof FormData) {
    delete req.headers['Content-Type'];
  }

  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return req;

  try {
    const decoded = jwtDecode(accessToken);
    const isExpired = dayjs.unix(decoded.exp).diff(dayjs()) < 1;
    if (!isExpired) {
      req.headers.Authorization = `Bearer ${accessToken}`;
      return req;
    }
    // Expired: refresh before sending. The caller waits on the shared
    // subscriber queue (see waitForTokenRefresh), so it always completes.
    const token = await waitForTokenRefresh();
    if (token) req.headers.Authorization = `Bearer ${token}`;
  } catch {
    // Ignore — backend will respond 401 and the response interceptor handles it.
  }
  return req;
});

// ─── Response interceptor: retry once after refresh ─────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Only attempt recovery for auth failures and avoid infinite loops.
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Whether this request starts the refresh or joins one in flight, it
      // resolves with the refreshed token (or null if refresh failed).
      const token = await waitForTokenRefresh();
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      }
      clearAuth();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
