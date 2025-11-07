import API from "./axios";

// Fetch current user profile (generic)
export const getProfile = async () => {
  const res = await API.get("/users/profile");
  return res.data;
};

// Update current user's profile (generic)
export const updateProfile = async (data) => {
  const config = {
    headers: {
      "Content-Type":
        data instanceof FormData ? "multipart/form-data" : "application/json",
    },
  };
  const res = await API.put("/users/profile", data, config);
  return res.data.user; // Return just the user object from the response
};

// Fetch any user's profile by ID (for public profile pages)
export const getUserById = async (id) => {
  const res = await API.get(`/users/${id}`);
  return res.data;
};

export default { getProfile, updateProfile, getUserById };