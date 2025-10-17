import API from "./axios";

export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data);
  if (res.data.accessToken) {
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
  }
  return res.data;
};

export const loginUser = async (data) => {
  const res = await API.post("/auth/login", data);
  if (res.data.accessToken) {
    localStorage.setItem("accessToken", res.data.accessToken);
    localStorage.setItem("refreshToken", res.data.refreshToken);
  }
  return res.data;
};

export const logoutUser = async () => {
  const res = await API.post("/auth/logout");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  return res.data;
};

export const fetchCurrentUser = async () => {
  const res = await API.get("/auth/me");
  return res.data;
};
