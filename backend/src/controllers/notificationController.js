import User from "../models/User.js";

// Get user notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10, page = 1, unreadOnly = false } = req.query;

    const user = await User.findById(userId).select('notifications');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let notifications = user.notifications || [];

    // Filter for unread only if requested
    if (unreadOnly === 'true') {
      notifications = notifications.filter(n => !n.read);
    }

    // Sort by creation date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedNotifications = notifications.slice(startIndex, endIndex);

    res.json({
      notifications: paginatedNotifications,
      totalCount: notifications.length,
      unreadCount: user.notifications.filter(n => !n.read).length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(notifications.length / limit)
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Mark notification as read (with optional delete)
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;
    const { deleteAfterRead = false } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const notification = user.notifications.id(notificationId);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.read = true;
    
    // Delete notification if requested (to keep database clean)
    if (deleteAfterRead) {
      user.notifications.pull(notificationId);
    }
    
    await user.save();

    res.json({ 
      message: deleteAfterRead ? "Notification marked as read and deleted" : "Notification marked as read",
      deleted: deleteAfterRead
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// Mark all notifications as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.notifications.forEach(notification => {
      notification.read = true;
    });

    await user.save();

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.notifications.pull(notificationId);
    await user.save();

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

// Clear all notifications
export const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.notifications = [];
    await user.save();

    res.json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ error: "Failed to clear notifications" });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('notifications');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const unreadCount = user.notifications.filter(n => !n.read).length;

    res.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
};
