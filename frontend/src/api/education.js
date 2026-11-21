import API from "./axios";

// Education Resources API client

export const fetchResources = (params = {}) =>
  API.get("/education/resources", { params });

export const fetchRecentResources = (limit = 6) =>
  API.get("/education/resources/recent", { params: { limit } });

export const fetchResource = (id) =>
  API.get(`/education/resources/${id}`);

export const uploadResource = (formData, onUploadProgress) =>
  API.post("/education/resources", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress,
  });

export const fetchDownloadUrl = (id) =>
  API.get(`/education/resources/${id}/download`);

export const fetchMyResources = (params = {}) =>
  API.get("/education/my-resources", { params });

export const deleteResource = (id, reason) =>
  API.delete(`/education/resources/${id}`, { data: { reason } });

// Resource requests
export const fetchRequests = (params = {}) =>
  API.get("/education/requests", { params });

export const createRequest = (data) =>
  API.post("/education/requests", data);

export const fetchMyRequests = () =>
  API.get("/education/requests/mine");

export const closeRequest = (id) =>
  API.patch(`/education/requests/${id}/close`);

// Copyright reports
export const submitReport = (resourceId, data) =>
  API.post(`/education/resources/${resourceId}/report`, data);

export const fetchMyReports = () =>
  API.get("/education/my-reports");

// Admin endpoints
export const adminFetchEducationStats = () =>
  API.get("/admin/education/stats");

export const adminFetchResources = (params = {}) =>
  API.get("/admin/education/resources", { params });

export const adminReviewResource = (id, payload) =>
  API.patch(`/admin/education/resources/${id}/review`, payload);

export const adminFetchDownloadUrl = (id) =>
  API.get(`/admin/education/resources/${id}/download`);

export const adminFetchReports = (params = {}) =>
  API.get("/admin/education/reports", { params });

export const adminUpdateReport = (id, payload) =>
  API.patch(`/admin/education/reports/${id}`, payload);

export const adminFetchRequests = (params = {}) =>
  API.get("/admin/education/requests", { params });

export const adminUpdateRequest = (id, payload) =>
  API.patch(`/admin/education/requests/${id}`, payload);
