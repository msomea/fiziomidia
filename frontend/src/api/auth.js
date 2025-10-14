import API from "./axios";

// Register user
export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data);
  return res.data;
};

// Login user
export const loginUser = async (data) => {
  const res = await API.post("/auth/login", data);
  return res.data;
};

// Logout
export const logoutUser = async () => {
  const res = await API.post("/auth/logout");
  return res.data;
};

// Fetch current user
export const fetchCurrentUser = async () => {
  const res = await API.get("/auth/me");
  return res.data;
};

// Refresh JWT
export const refreshToken = async () => {
  const res = await API.post("/auth/refresh");
  return res.data;
};
