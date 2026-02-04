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
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
API.interceptors.response.use(
  (response) => {
    // If backend refreshed the access token on activity, update stored token
    const refreshed =
      response.headers &&
      (response.headers["x-access-token"] ||
        response.headers["X-Access-Token"]);
    if (refreshed) {
      const token = refreshed;
      localStorage.setItem("accessToken", token);
      // keep `user` object in sync if present
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          u.accessToken = token;
          localStorage.setItem("user", JSON.stringify(u));
        } catch (e) {
          // ignore malformed user
        }
      }
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    return response;
  },
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
        API.defaults.headers.common["Authorization"] =
          `Bearer ${newAccessToken}`;
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
  },
);

export default API;
