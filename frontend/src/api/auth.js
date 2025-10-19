import API from "./axios";

// ---------------------------
// Register user
// ---------------------------
export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data);
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
  const res = await API.post("/auth/login", data);
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
    await API.post("/auth/logout", { token: refreshToken });
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
  const res = await API.get("/auth/me");
  return res.data;
};
