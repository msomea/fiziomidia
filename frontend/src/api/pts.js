import API from "./axios";
import { API_URL } from "../config/constants";

// Fetch all PTs
export const fetchPTs = async () => {
  const res = await API.get(`${API_URL}/pts`);
  return res.data;
};

// Fetch single PT by ID
export const fetchPTById = async (id) => {
  const res = await API.get(`${API_URL}/pts/${id}`);
  return res.data;
};

// Update PT profile (requires auth + proper role)
export const updatePTProfile = async (id, data) => {
  const res = await API.put(`${API_URL}/pts/${id}`, data);
  return res.data;
};

// Fetch PT dashboard data
export const fetchPTDashboardData = async (ptId) => {
  const res = await API.get(`${API_URL}/pts/${ptId}/dashboard`);
  return res.data;
};

// Fetch PT dashboard stats
export const fetchPTDashboardStats = async (ptId) => {
  const res = await API.get(`${API_URL}/pts/${ptId}/dashboard-stats`);
  return res.data;
};