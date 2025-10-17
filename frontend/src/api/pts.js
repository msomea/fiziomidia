import API from "./axios";


// Fetch all PTs
export const fetchPTs = async () => {
  const res = await API.get("/pts");
  return res.data;
};

// Fetch single PT by ID
export const fetchPTById = async (id) => {
  const res = await API.get(`/pts/${id}`);
  return res.data;
};

// Update PT profile (requires auth + proper role)
export const updatePTProfile = async (id, data) => {
  const res = await API.put(`/pts/${id}`, data);
  return res.data;
};