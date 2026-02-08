import API from "./axios";
import { API_URL } from "../config/constants";
// Fetch all messages in a chat
export const getMessages = async (chatId) => {
  const res = await API.get(`${API_URL}/messages/${chatId}`);
  return res.data;
};

// Send a new message
export const sendMessage = async (data) => {
  // data = { chatId, text }
  const res = await API.post(`${API_URL}/messages`, data);
  return res.data;
};

// Delete a message by ID
export const deleteMessage = async (messageId) => {
  const res = await API.delete(`${API_URL}/messages/${messageId}`);
  return res.data;
};
