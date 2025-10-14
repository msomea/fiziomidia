import API from "./axios";
import User from "../../../backend/src/models/User";

// Request a new appointment
export const requestAppointment = async (data) => {
  const res = await API.post("/appointments", data);
  return res.data;
};

// Get appointments (optional: role='all' for admin)
export const fetchAppointments = async (role) => {
  const res = await API.get("/appointments", { params: { role } });
  return res.data;
};

// Update appointment status
export const updateAppointmentStatus = async (id, action, scheduledAt) => {
  const res = await API.put(`/appointments/${id}`, { action, scheduledAt });
  return res.data;
};

// Delete an appointment
export const deleteAppointment = async (id) => {
  const res = await API.delete(`/appointments/${id}`);
  return res.data;
};

// Fetch a single appointment by ID
export const fetchAppointmentById = async (id) => {
  const res = await API.get(`/appointments/${id}`);
  return res.data;
};

// GET /api/appointments/member/:id
export const getAppointmentsByMember = async (memberId) => {
  try {
    const res = await API.get(`/appointments/member/${memberId}`);
    return res.data.appts; // backend returns { appts: [...] }
  } catch (err) {
    console.error("Failed to fetch member appointments:", err);
    throw err;
  }
};
