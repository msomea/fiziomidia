import API from "./axios";
import { API_URL } from "../config/constants";

//User Management
export const fetchAllUsers = async () => {
  const { data } = await API.get(`${API_URL}/admin/users`);
  return data;
};

export const fetchAdminAppointments = async () => {
  const { data } = await API.get(`${API_URL}/admin/appointments`);
  return data;
};

export const fetchAdminPromotions = async (params = {}) => {
  const res = await API.get(`${API_URL}/admin/promotions`, { params });
  return res.data;
};


// Forum Sub Sponsorship
export const fetchForumSubs = async () => {
  const { data } = await API.get(`${API_URL}/forum/subs`);
  return data;
};

export const updateSponsorship = async (id, payload) => {
  const { data } = await API.put(`${API_URL}/admin/subs/${id}/sponsorship`, payload);
  return data;
};

export const removeSponsorship = async (id) => {
  const { data } = await API.put(`${API_URL}/admin/subs/${id}/sponsorship/remove`);
  return data;
};

// Sponsored Products
// Fetch sponsored products for admin with pagination & optional filters
export const getSponsoredProducts = async ({ page = 1, ...filters } = {}) => {
  try {
    const res = await API.get(`${API_URL}/admin/sponsored-products`, {
      params: { page, ...filters },
    });
    return res.data; // { page, totalPages, products }
  } catch (err) {
    console.error("Failed to fetch sponsored products:", err);
    throw err;
  }
};

export const getSponsoredProductById = async (id) => {
  const res = await API.get(`${API_URL}/admin/sponsored-products/${id}`);
  return res.data;
};

export const createSponsoredProduct = (data) =>
  API.post(`${API_URL}/admin/sponsored-products`, data);

export const updateSponsoredProduct = (id, data) =>
  API.put(`${API_URL}/admin/sponsored-products/${id}`, data);

export const deleteSponsoredProduct = (id) =>
  API.delete(`${API_URL}/admin/sponsored-products/${id}`);

// Admin Monitoring APIs
export const getAdminActivityLogs = async (params = {}) => {
  try {
    const res = await API.get(`${API_URL}/admin/monitoring/logs`, { params });
    return res.data;
  } catch (err) {
    console.error("Failed to fetch admin activity logs:", err);
    throw err;
  }
};

export const getAdminStats = async (params = {}) => {
  try {
    const res = await API.get(`${API_URL}/admin/monitoring/stats`, { params });
    return res.data;
  } catch (err) {
    console.error("Failed to fetch admin stats:", err);
    throw err;
  }
};