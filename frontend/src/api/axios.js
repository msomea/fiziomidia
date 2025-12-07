import axios from "axios";
import { toast } from "react-hot-toast";

let isRefreshing = false;
let failedQueue = [];
let logoutHandler = null;

export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const API = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem("user");
    let accessToken = storedUser ? JSON.parse(storedUser).accessToken : null;
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid treating auth login/register attempts as "session expired".
      // If the request was explicitly to login or register, just reject so
      // the calling code can show appropriate error messages.
      const authSkip = ["/auth/login", "/auth/register", "/auth/logout"];
      if (
        originalRequest.url &&
        authSkip.some((r) => originalRequest.url.includes(r))
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        isRefreshing = false;
        if (logoutHandler) {
          // Show toast BEFORE navigation so UI remains mounted long enough
          toast.error("Session expired. Please log in again.");

          // Delay logout slightly so toast becomes visible
          setTimeout(() => {
            logoutHandler(); // Will use navigate() internally
          }, 800);

        } else {
          toast.error("Session expired. Please log in again.");
        }

        return Promise.reject(error);
      }

      try {
        const res = await axios.post("/api/auth/refresh", {
          token: refreshToken,
        });
        const newAccessToken = res.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);
        API.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return API(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        if (logoutHandler) {
          logoutHandler();
        } else {
          toast.error("Session expired. Please log in again.");
        }
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
