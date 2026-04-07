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

// PT Request functions
export const sendPTRequest = async (requestData) => {
  const response = await API.post(`/clinics/${requestData.clinicId}/requests`, requestData);
  return response.data;
};

export const getPTRequests = async (clinicId) => {
  const response = await API.get(`/clinics/${clinicId}/requests`);
  return response.data;
};

export const respondToPTRequest = async (requestId, action, responseMessage) => {
  const response = await API.put(`/clinics/requests/${requestId}/respond`, { action, responseMessage });
  return response.data;
};

export const cancelPTRequest = async (requestId) => {
  const response = await API.delete(`/clinics/requests/${requestId}`);
  return response.data;
};

export const getMyPTRequests = async () => {
  const response = await API.get('/clinics/my-requests');
  return response.data;
};

// PT Search function
export const searchPhysiotherapists = async (query) => {
  const response = await API.get(`/users/search/physiotherapists?q=${encodeURIComponent(query)}`);
  return response.data;
};
