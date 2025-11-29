import API from "./axios";

export const fetchAllUsers = async () => {
  const { data } = await API.get("/admin/users");
  return data;
};

export const fetchAdminAppointments = async () => {
  const { data } = await API.get("/admin/appointments");
  return data;
};

export const fetchAdminPromotions = async () => {
  const { data } = await API.get("/admin/promotions");
  return data;
};

// Sponsorship
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
