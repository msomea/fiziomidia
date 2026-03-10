import axios from "axios";
import { toast } from "react-hot-toast";
import { API_URL } from "../config/constants";
import i18n from "i18next";

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
  baseURL: API_URL,
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
    const refreshed =
      response.headers &&
      (response.headers["x-access-token"] ||
        response.headers["X-Access-Token"]);
    if (refreshed) {
      const token = refreshed;
      localStorage.setItem("accessToken", token);

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          u.accessToken = token;
          localStorage.setItem("user", JSON.stringify(u));
        } catch (e) {
        }
      }
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ------------------------------
    // HANDLE RATE LIMIT (429)
    // ------------------------------
    if (error.response?.status === 429) {
      const code = error.response?.data?.code;
      const message = error.response?.data?.message;
      const retryAfter = error.response?.data?.retryAfter;
      
      if (code === "RATE_LIMIT_LOGIN") {
        toast.error(message || i18n.t("rate_limit_login"));
      } else if (code === "RATE_LIMIT_REGISTER") {
        toast.error(message || i18n.t("rate_limit_register"));
      } else if (code === "RATE_LIMIT_RESET") {
        toast.error(message || i18n.t("rate_limit_reset"));
      } else if (code === "RATE_LIMIT_CONTACT") {
        toast.error(message || i18n.t("rate_limit_contact"));
      } else if (code === "RATE_LIMIT_REFRESH") {
        toast.error(message || i18n.t("rate_limit_refresh"));
      } else if (code === "RATE_LIMIT_MESSAGE") {
        toast.error(message || i18n.t("rate_limit_message"));
      } else if (code === "RATE_LIMIT_UPLOAD") {
        toast.error(message || i18n.t("rate_limit_upload"));
      } else if (code === "RATE_LIMIT_FORUM_POST") {
        toast.error(message || i18n.t("rate_limit_forum_post"));
      } else if (code === "RATE_LIMIT_FORUM_COMMENT") {
        toast.error(message || i18n.t("rate_limit_forum_comment"));
      } else if (code === "RATE_LIMIT_ADMIN") {
        toast.error(message || i18n.t("rate_limit_admin"));
      }
       else if (code === "RATE_LIMIT_GENERAL") {
        toast.error(message || i18n.t("rate_limit_general"));
      }

      if (retryAfter) {
        toast.error(`Try again in ${retryAfter} seconds.`);
      }

      return Promise.reject(error);
    }

    // ------------------------------
    // 401 REFRESH LOGIC
    // ------------------------------
    if (error.response?.status === 401 && !originalRequest._retry) {
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
        const res = await axios.post("/auth/refresh", {
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
