import axios from "axios";
import { toast } from "react-hot-toast";

let isRefreshing = false;
let failedQueue = [];

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

// Request interceptor: attach access token
API.interceptors.request.use(
  config => {
    const storedUser = localStorage.getItem("user");
    let accessToken = null;

    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      accessToken = parsed.accessToken;
    } else {
      accessToken = localStorage.getItem("accessToken");
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor: refresh token on 401
API.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post("/api/auth/refresh", { token: refreshToken });
        const newAccessToken = res.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);
        API.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return API(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        toast.error("Session expired. Please log in again.");
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
