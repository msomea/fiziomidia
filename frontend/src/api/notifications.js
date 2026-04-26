import API from "./axios";
import { API_URL } from "../config/constants";

// Get user notifications
export const getNotifications = async (params = {}) => {
  const res = await API.get(`${API_URL}/notifications`, { params });
  return res.data.notifications || []; // Extract notifications array from response
};


// Get unread notification count
export const getUnreadCount = async () => {
  const res = await API.get(`${API_URL}/notifications/unread/count`);
  return res.data;
};

// Mark notification as read (standardized function)
export const markNotificationRead = async (userId, notificationId) => {
  const response = await API.put(
    `${API_URL}/notifications/${notificationId}/read`,
    {
      deleteAfterRead: true, // Delete notification after marking as read
    },
  );
  return response.data;
};

// Mark all notifications as read
export const markAllNotificationsRead = async () => {
  const res = await API.patch(`${API_URL}/notifications/read-all`);
  return res.data;
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  const res = await API.delete(`${API_URL}/notifications/${notificationId}`);
  return res.data;
};

// Clear all notifications
export const clearAllNotifications = async () => {
  const res = await API.delete(`${API_URL}/notifications`);
  return res.data;
};
