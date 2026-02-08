import API from "./axios";
import { API_URL } from "../config/constants";

// Request a new appointment
export const requestAppointment = async (data) => {
  const res = await API.post(`${API_URL}/appointments`, data);
  return res.data;
};

// Get appointments (optional: role='all' for admin)
export const fetchAppointments = async (role) => {
  const res = await API.get(`${API_URL}/appointments`, { params: { role } });
  return res.data;
};

// Update appointment status
export const updateAppointmentStatus = async (id, action, scheduledAt) => {
  const res = await API.put(`${API_URL}/appointments/${id}`, { action, scheduledAt });
  return res.data;
};

// Delete an appointment
export const deleteAppointment = async (id) => {
  const res = await API.delete(`${API_URL}/appointments/${id}`);
  return res.data;
};

// Fetch a single appointment by ID
export const fetchAppointmentById = async (id) => {
  const res = await API.get(`${API_URL}/appointments/${id}`);
  return res.data;
};

// GET /api/appointments/member/:id
export const getAppointmentsByMember = async (memberId) => {
  try {
    const res = await API.get(`${API_URL}/appointments/member/${memberId}`);
    return res.data.appts; // backend returns { appts: [...] }
  } catch (err) {
    console.error("Failed to fetch member appointments:", err);
    throw err;
  }
};
