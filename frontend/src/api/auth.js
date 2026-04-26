import API from "./axios";
import { API_URL } from "../config/constants";

// ---------------------------
// Register user
// ---------------------------
export const registerUser = async (data) => {
  const res = await API.post(`${API_URL}/auth/register`, data);
  const { accessToken, refreshToken } = res.data;
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }
  return res.data;
};

// ---------------------------
// Login user
// ---------------------------
export const loginUser = async (data) => {
  const res = await API.post(`${API_URL}/auth/login`, data);
  const { accessToken, refreshToken } = res.data;
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }
  return res.data;
  
};

// ---------------------------
// Logout user
// ---------------------------
export const logoutUser = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    await API.post(`${API_URL}/auth/logout`, { token: refreshToken });
  } catch (err) {
    console.warn("Error logging out:", err);
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
};

// ---------------------------
// Fetch current user
// ---------------------------
export const fetchCurrentUser = async () => {
  // Fetch both basic auth data and complete profile
  const [authData, profileData] = await Promise.all([
    API.get(`${API_URL}/auth/me`),
    API.get(`${API_URL}/users/profile`),
  ]);

  // Combine the data, preferring profile data for overlapping fields
  return { ...authData.data, ...profileData.data };
};

// ---------------------------
// Forgot password
// ---------------------------
export const forgotPassword = async (email) => {
  const res = await API.post(`${API_URL}/auth/forgot-password`, { email });
  return res.data;
};

// ---------------------------
// Reset password
// ---------------------------
export const resetPassword = async (token, newPassword) => {
  const res = await API.post(`${API_URL}/auth/reset-password/${token}`, {
    newPassword,
  });
  return res.data;
};

// ---------------------------
// Verify email
// ---------------------------
export const verifyEmail = async (token) => {
  const res = await API.get(`${API_URL}/auth/verify-email/${token}`);
  return res.data;
};

// ---------------------------
// Change password
// ---------------------------
export const changePassword = async (oldPassword, newPassword) => {
  const res = await API.post(`${API_URL}/auth/change-password`, {
    oldPassword,
    newPassword,
  });
  return res.data;
};
