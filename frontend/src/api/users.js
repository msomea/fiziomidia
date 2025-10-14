import API from "./axios";

// Get current user profile
export const getProfile = async () => {
  const res = await API.get("/users/profile");
  return res.data;
};

// Update current user profile
export const updateProfile = async (data) => {
  const res = await API.put("/users/profile", data);
  return res.data;
};

// Fetch any user's profile by ID (for public profile pages)
export const getUserById = async (id) => {
  const res = await API.get(`/users/${id}`);
  return res.data;
};

// List all users (admin only)
export const listUsers = async () => {
  const res = await API.get("/users");
  return res.data;
};
