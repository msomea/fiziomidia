import API from "./axios";

// Fetch current user profile (generic)
export const getProfile = async () => {
  const res = await API.get("/users/profile");
  return res.data;
};

// Update current user's profile (generic)
export const updateProfile = async (data) => {
  const res = await API.put("/users/profile", data);
  return res.data;
};

// Fetch any user's profile by ID (for public profile pages)
export const getUserById = async (id) => {
  const res = await API.get(`/users/${id}`);
  return res.data;
};