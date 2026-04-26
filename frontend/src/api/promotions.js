import API from "./axios";
import { API_URL } from "../config/constants";

// Fetch all PT promotions
export const fetchPromotions = async () => {
  const res = await API.get(`${API_URL}/promotions/pt`);
  return res.data;
};

// Fetch all clinic promotions
export const fetchClinicPromotions = async () => {
  const res = await API.get(`${API_URL}/promotions/clinic`);
  return res.data;
};

// Fetch a single PT promotion by ID
export const fetchPromotionById = async (id) => {
  const res = await API.get(`${API_URL}/promotions/pt/${id}`);
  return res.data;
};

// Create a PT promotion (requires authentication)
export const createPTPromotion = async (formData) => {
  const res = await API.post(`${API_URL}/promotions/pt/create`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Create a promotion checkout session (requires authentication)
export const createPromotionCheckout = async (data) => {
  // data could include promotionId, amount, etc.
  const res = await API.post(
    `${API_URL}/promotions/pt/create-checkout-session`,
    data,
  );
  return res.data;
};

// --- Sponsored Products ---
// Create sponsored product (requires authentication)
export const createSponsoredProduct = async (formData) => {
  const res = await API.post(`${API_URL}/sponsored-products`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Get all sponsored products
export const getSponsoredProducts = async () => {
  const res = await API.get(`${API_URL}/sponsored-products`);
  return res.data;
};

// Get sponsored products by category
export const getSponsoredProductsByCategory = async (category) => {
  const res = await API.get(`${API_URL}/sponsored-products?category=${category}`);
  return res.data;
};

// --- Clinic Promotions ---
// Create clinic promotion (requires authentication)
export const createClinicPromotion = async (formData) => {
  const res = await API.post(`${API_URL}/promotions/clinic`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};


// Fetch a single clinic promotion by ID
export const fetchClinicPromotionById = async (id) => {
  const res = await API.get(`${API_URL}/promotions/clinic/${id}`);
  return res.data;
};

// Update clinic promotion
export const updateClinicPromotion = async (id, formData) => {
  const res = await API.put(`${API_URL}/promotions/clinic/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Delete clinic promotion
export const deleteClinicPromotion = async (id) => {
  const res = await API.delete(`${API_URL}/promotions/clinic/${id}`);
  return res.data;
};
