import API from "./axios";
import { API_URL } from "../config/constants";

//User Management
export const fetchAllUsers = async (params = {}) => {
  try {
    const { data } = await API.get(`${API_URL}/admin/users`, { params });
    return data;
  } catch (err) {
    console.error("Failed to fetch all users:", err);
    throw err;
  }
};

export const getAdminUserById = async (id) => {
  try {
    const res = await API.get(`${API_URL}/admin/users/${id}`);
    return res.data;
  } catch (err) {
    console.error("Failed to get admin user by ID:", err);
    throw err;
  }
};

export const updateUserRole = async (id, data) => {
  try {
    const res = await API.put(`${API_URL}/admin/users/${id}/role`, data);
    return res.data;
  } catch (err) {
    console.error("Failed to update user role:", err);
    throw err;
  }
};

export const updateUserLicense = async (id, data) => {
  try {
    const res = await API.put(`${API_URL}/admin/users/${id}/license`, data);
    return res.data;
  } catch (err) {
    console.error("Failed to update user license:", err);
    throw err;
  }
};

export const sendEmailToUser = async (id, data) => {
  try {
    const res = await API.post(`${API_URL}/admin/users/${id}/email`, data);
    return res.data;
  } catch (err) {
    console.error("Failed to send email to user:", err);
    throw err;
  }
};

// Appointments managements

export const fetchAdminAppointments = async (params = {}) => {
  try {
    const { data } = await API.get(`${API_URL}/admin/appointments`, { params });
    return data;
  } catch (err) {
    console.error("Failed to fetch admin appointments:", err);
    throw err;
  }
};

// PT Promotion Managements
export const fetchAdminPTPromotions = async (params = {}) => {
  try {
    const res = await API.get(`${API_URL}/admin/promotions`, { params });
    return res.data;
  } catch (err) {
    console.error("Failed to fetch admin PT promotions:", err);
    throw err;
  }
};

export const fetchClinicPromotions = async (params = {}) => {
  try {
    const res = await API.get(`${API_URL}/admin/clinic-promotions`, { params });
    return res.data;
  } catch (err) {
    console.error("Failed to fetch clinic promotions:", err);
    throw err;
  }
};

export const getPromotionById = async (id) => {
  try {
    const res = await API.get(`${API_URL}/admin/promotions/${id}`);
    return res.data;
  } catch (err) {
    console.error("Failed to get promotion by ID:", err);
    throw err;
  }
};

export const updatePromotion = async (id, data) => {
  try {
    const res = await API.put(`${API_URL}/admin/promotions/${id}`, data);
    return res.data;
  } catch (err) {
    console.error("Failed to update promotion:", err);
    throw err;
  }
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
  try {
    const res = await API.delete(`${API_URL}/admin/promotions/${id}`);
    return res.data;
  } catch (err) {
    console.error("Failed to delete promotion:", err);
    throw err;
  }
};

// Clinic promotion  Management
export const getClinicPromotionById = async (id) => {
  try {
    const res = await API.get(`${API_URL}/admin/clinic-promotions/${id}`);
    return res.data;
  } catch (err) {
    console.error("Failed to get clinic promotion by ID:", err);
    throw err;
  }
};

export const updateClinicPromotion = async (id, data) => {
  try {
    const res = await API.put(`${API_URL}/admin/clinic-promotions/${id}`, data);
    return res.data;
  } catch (err) {
    console.error("Failed to update clinic promotion:", err);
    throw err;
  }
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
  try {
    const res = await API.delete(`${API_URL}/admin/clinic-promotions/${id}`);
    return res.data;
  } catch (err) {
    console.error("Failed to delete clinic promotion:", err);
    throw err;
  }
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
  try {
    const res = await API.get(`${API_URL}/admin/forum/mod-requests/${id}`);
    return res.data;
  } catch (err) {
    console.error("Failed to get forum mod request by ID:", err);
    throw err;
  }
};

export const updateForumModRequestRole = async (id, data) => {
  try {
    const res = await API.put(
      `${API_URL}/admin/forum/mod-requests/${id}/role`,
      data,
    );
    return res.data;
  } catch (err) {
    console.error("Failed to update forum mod request role:", err);
    throw err;
  }
};

export const getAdminSubById = async (id) => {
  try {
    const res = await API.get(`${API_URL}/admin/subs/${id}`);
    return res.data;
  } catch (err) {
    console.error("Failed to get admin sub by ID:", err);
    throw err;
  }
};

export const updateSubInfo = async (id, data) => {
  try {
    const res = await API.put(`${API_URL}/forum/subs/${id}`, data);
    return res.data;
  } catch (err) {
    console.error("Failed to update sub info:", err);
    throw err;
  }
};


// Forum Sub Sponsorship
// Note: fetchForumSubs is now available from ../api/forum.js

export const updateSponsorship = async (id, payload) => {
  try {
    const { data } = await API.put(
      `${API_URL}/admin/subs/${id}/sponsorship`,
      payload,
    );
    return data;
  } catch (err) {
    console.error("Failed to update sponsorship:", err);
    throw err;
  }
};

export const removeSponsorship = async (id) => {
  try {
    const { data } = await API.put(
      `${API_URL}/admin/subs/${id}/sponsorship/remove`,
    );
    return data;
  } catch (err) {
    console.error("Failed to remove sponsorship:", err);
    throw err;
  }
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
  try {
    const res = await API.get(`${API_URL}/admin/sponsored-products/${id}`);
    return res.data;
  } catch (err) {
    console.error("Failed to get sponsored product by ID:", err);
    throw err;
  }
};

export const createSponsoredProduct = async (data) => {
  try {
    const res = await API.post(`${API_URL}/admin/sponsored-products`, data);
    return res.data;
  } catch (err) {
    console.error("Failed to create sponsored product:", err);
    throw err;
  }
};

export const updateSponsoredProduct = async (id, data) => {
  try {
    const res = await API.put(
      `${API_URL}/admin/sponsored-products/${id}`,
      data,
    );
    return res.data;
  } catch (err) {
    console.error("Failed to update sponsored product:", err);
    throw err;
  }
};

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

export const deleteSponsoredProduct = async (id) => {
  try {
    const res = await API.delete(`${API_URL}/admin/sponsored-products/${id}`);
    return res.data;
  } catch (err) {
    console.error("Failed to delete sponsored product:", err);
    throw err;
  }
};

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

// Unified Search API
export const performUnifiedSearch = async (params = {}) => {
  try {
    const {
      types = [],
      search = "",
      filters = {},
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = params;

    const searchParams = {
      types: Array.isArray(types) ? types.join(',') : types,
      search,
      filters: JSON.stringify(filters),
      page,
      limit,
      sortBy,
      sortOrder
    };

    const { data } = await API.get(`${API_URL}/admin/search`, { params: searchParams });
    return data;
  } catch (err) {
    console.error("Failed to perform unified search:", err);
    throw err;
  }
};