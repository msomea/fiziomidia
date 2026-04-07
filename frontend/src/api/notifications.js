import API from "./axios";

// Get user notifications
export const getUserNotifications = async (userId) => {
  const response = await API.get(`/users/${userId}/notifications`);
  return response.data;
};

// Mark notification as read
export const markNotificationAsRead = async (userId, notificationId) => {
  const response = await API.put(`/users/${userId}/notifications/read`, {
    notificationId
  });
  return response.data;
};
