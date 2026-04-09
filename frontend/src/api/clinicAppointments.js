import API from "./axios";

// Request appointment at clinic level
export const requestClinicAppointment = async (appointmentData) => {
  const response = await API.post("/clinic-appointments", appointmentData);
  return response.data;
};

// Get available PTs for a clinic
export const getClinicAvailablePTs = async (clinicId) => {
  const response = await API.get(`/clinic-appointments/clinic/${clinicId}/available-pts`);
  return response.data;
};

// Get clinic appointments (for clinic owners)
export const getClinicAppointments = async (clinicId) => {
  const response = await API.get(`/clinic-appointments/clinic/${clinicId}`);
  return response.data;
};

// Update clinic appointment status (accept/reject/cancel)
export const updateClinicAppointmentStatus = async (appointmentId, updateData) => {
  const response = await API.patch(`/clinic-appointments/${appointmentId}/status`, updateData);
  return response.data;
};

// Get PTs available for assignment at a clinic
export const getClinicPTsForAssignment = async (clinicId) => {
  const response = await API.get(`/clinic-appointments/clinic/${clinicId}/pts-for-assignment`);
  return response.data;
};

// Get member's clinic appointments
export const getMemberClinicAppointments = async () => {
  const response = await API.get('/clinic-appointments/member/appointments');
  return response.data;
};

// Get clinic appointments for PTs who work at the clinic
export const getClinicAppointmentsForPT = async (clinicId) => {
  const response = await API.get(`/clinic-appointments/clinic/${clinicId}/pt-view`);
  return response.data;
};

// Get a single clinic appointment by ID
export const getClinicAppointmentById = async (appointmentId) => {
  const response = await API.get(`/clinic-appointments/${appointmentId}`);
  return response.data;
};
