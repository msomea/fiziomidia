import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // allows cookies/JWT
});

// Add request interceptor to attach token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // store JWT in localStorage
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle global errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optionally handle 401 errors globally
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized! Redirect to login.");
    }
    return Promise.reject(error);
  }
);

export default API;
