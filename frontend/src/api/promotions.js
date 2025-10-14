import API from "./axios";

// Fetch all promotions
export const fetchPromotions = async () => {
  const res = await API.get("/promotions");
  return res.data;
};

// Fetch a single promotion by ID
export const fetchPromotionById = async (id) => {
  const res = await API.get(`/promotions/${id}`);
  return res.data;
};

// Create a promotion checkout session (requires authentication)
export const createPromotionCheckout = async (data) => {
  // data could include promotionId, amount, etc.
  const res = await API.post("/promotions/create-checkout-session", data);
  return res.data;
};
