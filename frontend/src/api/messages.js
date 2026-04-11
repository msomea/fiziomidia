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

// --- Users ---
// Get all users for messaging
export const getUsers = async () => {
  const res = await API.get(`${API_URL}/users`);
  return res.data;
};

// --- Conversations ---
// Get all conversations for current user
export const getConversations = async () => {
  const res = await API.get(`${API_URL}/conversations`);
  return res.data;
};

// Get conversation with specific user
export const getConversationByUser = async (userId) => {
  const res = await API.get(`${API_URL}/conversations/user/${userId}`);
  return res.data;
};

// Create new conversation
export const createConversation = async (receiverId) => {
  const res = await API.post(`${API_URL}/conversations`, {
    receiver: receiverId,
  });
  return res.data;
};

// Mark conversation as read
export const markConversationAsRead = async (conversationId) => {
  const res = await API.put(`${API_URL}/conversations/${conversationId}/mark-read`);
  return res.data;
};

// Delete conversation
export const deleteConversation = async (conversationId) => {
  const res = await API.delete(`${API_URL}/conversations/${conversationId}`);
  return res.data;
};
