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
