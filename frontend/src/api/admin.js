import API from "./axios";
import { API_URL } from "../config/constants";

//User Management
export const fetchAllUsers = async (params = {}) => {
  const { data } = await API.get(`${API_URL}/admin/users`, { params });
  return data;
};

export const getAdminUserById = async (id) => {
  const res = await API.get(`${API_URL}/admin/users/${id}`);
  return res.data;
};

export const updateUserRole = async (id, data) => {
  const res = await API.put(`${API_URL}/admin/users/${id}/role`, data);
  return res.data;
};

export const updateUserLicense = async (id, data) => {
  const res = await API.put(`${API_URL}/admin/users/${id}/license`, data);
  return res.data;
};

export const sendEmailToUser = async (id, data) => {
  const res = await API.post(`${API_URL}/admin/users/${id}/email`, data);
  return res.data;
};

// Appointments managements

export const fetchAdminAppointments = async (params = {}) => {
  const { data } = await API.get(`${API_URL}/admin/appointments`, { params });
  return data;
};

// PT Promotion Managements
export const fetchAdminPTPromotions = async (params = {}) => {
  const res = await API.get(`${API_URL}/admin/promotions`, { params });
  return res.data;
};

export const fetchClinicPromotions = async (params = {}) => {
  const res = await API.get(`${API_URL}/admin/clinic-promotions`, { params });
  return res.data;
};

export const getPromotionById = async (id) => {
  const res = await API.get(`${API_URL}/admin/promotions/${id}`);
  return res.data;
};

export const updatePromotion = async (id, data) => {
  const res = await API.put(`${API_URL}/admin/promotions/${id}`, data);
  return res.data;
};

export const updatePromotionWithCacheInvalidation = async (
  id,
  data,
  invalidateCache = null,
) => {
  const result = await updatePromotion(id, data);
  if (invalidateCache) {
    try {
      await invalidateCache();
    } catch (error) {
      console.warn("Failed to invalidate cache:", error);
    }
  }
  return result;
};

export const deletePromotion = async (id) => {
  const res = await API.delete(`${API_URL}/admin/promotions/${id}`);
  return res.data;
};

// Clinic promotion  Management
export const getClinicPromotionById = async (id) => {
  const res = await API.get(`${API_URL}/admin/clinic-promotions/${id}`);
  return res.data;
};

export const updateClinicPromotion = async (id, data) => {
  const res = await API.put(`${API_URL}/admin/clinic-promotions/${id}`, data);
  return res.data;
};

export const updateClinicPromotionWithCacheInvalidation = async (
  id,
  data,
  invalidateCache = null,
) => {
  const result = await updateClinicPromotion(id, data);
  if (invalidateCache) {
    try {
      await invalidateCache();
    } catch (error) {
      console.warn("Failed to invalidate cache:", error);
    }
  }
  return result;
};

export const deleteClinicPromotion = async (id) => {
  const res = await API.delete(`${API_URL}/admin/clinic-promotions/${id}`);
  return res.data;
};

// Forum management
export const getForumModRequests = async (params = {}) => {
  try {
    const res = await API.get(`${API_URL}/admin/forum/mod-requests`, {
      params,
    });
    return res.data;
  } catch (err) {
    console.error("Failed to fetch forum mod requests:", err);
    throw err;
  }
};

export const getForumModRequestById = async (id) => {
  const res = await API.get(`${API_URL}/admin/forum/mod-requests/${id}`);
  return res.data;
};

export const updateForumModRequestRole = async (id, data) => {
  const res = await API.put(
    `${API_URL}/admin/forum/mod-requests/${id}/role`,
    data,
  );
  return res.data;
};

export const getAdminSubById = async (id) => {
  const res = await API.get(`${API_URL}/admin/subs/${id}`);
  return res.data;
};

export const updateSubInfo = async (id, data) => {
  const res = await API.put(`${API_URL}/forum/subs/${id}`, data);
  return res.data;
};


// Forum Sub Sponsorship
// Note: fetchForumSubs is now available from ../api/forum.js

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

export const updateSponsoredProductWithCacheInvalidation = async (
  id,
  data,
  invalidateCache = null,
) => {
  const result = await updateSponsoredProduct(id, data);
  if (invalidateCache) {
    try {
      await invalidateCache();
    } catch (error) {
      console.warn("Failed to invalidate cache:", error);
    }
  }
  return result;
};

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

// System Notifications
export const sendSystemNotification = async (payload) => {
  try {
    const { data } = await API.post(`${API_URL}/notifications/send-system`, payload);
    return data;
  } catch (err) {
    console.error("Failed to send system notification:", err);
    throw err;
  }
};

// Consolidated Dashboard API
export const fetchDashboardData = async (filters = {}) => {
  try {
    const { data } = await API.get(`${API_URL}/admin/dashboard`, { params: filters });
    return data;
  } catch (err) {
    console.error("Failed to fetch dashboard data:", err);
    throw err;
  }
};