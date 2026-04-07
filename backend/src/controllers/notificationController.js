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

// Send system notification (admin only)
export const sendSystemNotification = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { 
      message, 
      priority = 'information', 
      targetUserIds = [], 
      sendToAll = false,
      targetRole = null, // "member", "physiotherapist", or null for all
      type = 'system_announcement'
    } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: "Message is required" });
    }

    // Validate priority
    const validPriorities = ['critical', 'important', 'update', 'information'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ error: "Invalid priority level" });
    }

    let targetUsers;
    
    if (sendToAll) {
      // Get all active users except admins
      targetUsers = await User.find({ 
        role: { $nin: ['admin'] }, 
        isActive: true 
      });
    } else if (targetRole && (targetRole === 'member' || targetRole === 'physiotherapist')) {
      // Get users by specific role
      targetUsers = await User.find({ 
        role: targetRole,
        isActive: true 
      });
    } else if (targetUserIds && targetUserIds.length > 0) {
      // Get specific users
      targetUsers = await User.find({ 
        _id: { $in: targetUserIds },
        isActive: true 
      });
    } else {
      return res.status(400).json({ error: "Either sendToAll, targetRole, or targetUserIds must be specified" });
    }

    if (targetUsers.length === 0) {
      return res.status(404).json({ error: "No target users found" });
    }

    const notification = {
      type,
      message: message.trim(),
      priority,
      read: false,
      createdAt: new Date(),
    };

    // Send notifications to all target users
    const updatePromises = targetUsers.map(user => {
      user.notifications.push(notification);
      return user.save();
    });

    await Promise.all(updatePromises);

    console.log(`System notification sent to ${targetUsers.length} users (Priority: ${priority})`);

    res.json({
      message: `System notification sent successfully to ${targetUsers.length} users`,
      sentTo: targetUsers.length,
      priority,
      type
    });

  } catch (error) {
    console.error("Error sending system notification:", error);
    res.status(500).json({ error: "Failed to send system notification" });
  }
};
