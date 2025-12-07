import API from "./axios";

//User Management
export const fetchAllUsers = async () => {
  const { data } = await API.get("/admin/users");
  return data;
};

export const fetchAdminAppointments = async () => {
  const { data } = await API.get("/admin/appointments");
  return data;
};

export const fetchAdminPromotions = async (params = {}) => {
  const res = await API.get("/admin/promotions", { params });
  return res.data;
};


// Forum Sub Sponsorship
export const fetchForumSubs = async () => {
  const { data } = await API.get("/forum/subs");
  return data;
};

export const updateSponsorship = async (id, payload) => {
  const { data } = await API.put(`/admin/subs/${id}/sponsorship`, payload);
  return data;
};

export const removeSponsorship = async (id) => {
  const { data } = await API.put(`/admin/subs/${id}/sponsorship/remove`);
  return data;
};

// Sponsored Products
// Fetch sponsored products for admin with pagination & optional filters
export const getSponsoredProducts = async ({ page = 1, ...filters } = {}) => {
  try {
    const res = await API.get("/admin/sponsored-products", {
      params: { page, ...filters },
    });
    return res.data; // { page, totalPages, products }
  } catch (err) {
    console.error("Failed to fetch sponsored products:", err);
    throw err;
  }
};

export const getSponsoredProductById = async (id) => {
  const res = await API.get(`/admin/sponsored-products/${id}`);
  return res.data;
};

export const createSponsoredProduct = (data) =>
  API.post("/admin/sponsored", data);

export const updateSponsoredProduct = (id, data) =>
  API.put(`/admin/sponsored/${id}`, data);

export const deleteSponsoredProduct = (id) =>
  API.delete(`/admin/sponsored/${id}`);