import API from "./axios";
import { API_URL } from "../config/constants";

// Get current user profile
export const getProfile = async () => {
  const res = await API.get(`${API_URL}/users/profile`);
  return res.data;
};

// Update current user profile
export const updateProfile = async (data) => {
  const res = await API.put(`${API_URL}/users/profile`, data);
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