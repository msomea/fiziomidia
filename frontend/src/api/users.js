import API from "./axios";
import { API_URL } from "../config/constants";

// Get current user profile
export const getProfile = async () => {
  const res = await API.get(`${API_URL}/users/profile`);
  return res.data;
};

// Update current user profile
export const updateProfile = async (data) => {
  // If sending FormData let the browser set the Content-Type (with boundary).
  const config = {};
  if (!(data instanceof FormData)) {
    config.headers = { "Content-Type": "application/json" };
  }
  const res = await API.put(`${API_URL}/users/profile`, data, config);
  return res.data;
};

// Fetch any user's profile by ID (for public profile pages)
export const getUserById = async (id) => {
  const res = await API.get(`${API_URL}/users/${id}`);
  return res.data;
};

// List all users (admin only)
export const listUsers = async () => {
  const res = await API.get(`${API_URL}/users`);
  return res.data;
};

// Toggle save/unsave PT for a member
export const toggleSavePT = async (ptId) => {
  const res = await API.post(`${API_URL}/users/save-pt/${ptId}`);
  return res.data;
}; 


// Get saved PTs for a member (admin or the member themselves)
export const getSavedPTsByMember = async (memberId) => {
  const res = await API.get(`${API_URL}/users/${memberId}/saved-pts`);
  return res.data;
};

// Get appointments for a specific member
export const getAppointmentsByMember = async (memberId) => {
  const res = await API.get(`${API_URL}/appointments/member/${memberId}`);
  return res.data;
};

// Update user language preference
export const updateLanguage = async (language) => {
  const res = await API.put("/users/update-language", { language });
  return res.data;
};