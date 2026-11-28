import API from "./axios";
import { API_URL } from "../config/constants";

// AI agent management — knowledge base + agent status

export const getAIStatus = async () => {
  const { data } = await API.get(`${API_URL}/ai/status`);
  return data;
};

export const listKnowledgeDocuments = async (params = {}) => {
  const { data } = await API.get(`${API_URL}/ai/knowledge`, { params });
  return data;
};

export const updateKnowledgeDocument = async (id, patch) => {
  const { data } = await API.put(`${API_URL}/ai/knowledge/${id}`, patch);
  return data;
};

export const uploadKnowledgeDocument = async (formData) => {
  const { data } = await API.post(`${API_URL}/ai/knowledge/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const listAIActivity = async (params = {}) => {
  const { data } = await API.get(`${API_URL}/ai/activity`, { params });
  return data;
};

// Agent configuration (models, schedules, toggles)
export const getAIConfig = async () => {
  const { data } = await API.get(`${API_URL}/ai/config`);
  return data;
};

export const updateAIConfig = async (patch) => {
  const { data } = await API.put(`${API_URL}/ai/config`, patch);
  return data;
};

// Generated content review workflow (forum content agent)
export const listGeneratedContent = async (params = {}) => {
  const { data } = await API.get(`${API_URL}/ai/content`, { params });
  return data;
};

export const reviewGeneratedContent = async (id, payload) => {
  const { data } = await API.put(`${API_URL}/ai/content/${id}/review`, payload);
  return data;
};

export const triggerForumDraft = async (forumSubId) => {
  const { data } = await API.post(`${API_URL}/ai/forum/draft`, { forumSubId });
  return data;
};
