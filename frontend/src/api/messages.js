import API from "./axios";

// Fetch all messages in a chat
export const getMessages = async (chatId) => {
  const res = await API.get(`/messages/${chatId}`);
  return res.data;
};

// Send a new message
export const sendMessage = async (data) => {
  // data = { chatId, text }
  const res = await API.post("/messages", data);
  return res.data;
};

// Delete a message by ID
export const deleteMessage = async (messageId) => {
  const res = await API.delete(`/messages/${messageId}`);
  return res.data;
};
