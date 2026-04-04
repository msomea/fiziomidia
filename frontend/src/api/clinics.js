import API from "./axios";

export const getClinics = async () => {
  const response = await API.get("/clinics");
  return response.data;
};

export const createClinic = async (clinicData) => {
  const response = await API.post("/clinics", clinicData);
  return response.data;
};

export const updateClinic = async (id, clinicData) => {
  const response = await API.put(`/clinics/${id}`, clinicData);
  return response.data;
};

export const deleteClinic = async (id) => {
  const response = await API.delete(`/clinics/${id}`);
  return response.data;
};

export const getPTClinics = async (ptId) => {
  const response = await API.get(`/clinics/pt/${ptId}`);
  return response.data;
};

export const getUserClinics = async (userId) => {
  const response = await API.get(`/clinics/user/${userId}`);
  return response.data;
};
