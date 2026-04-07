import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadCount,
} from "../controllers/notificationController.js";

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// Get user notifications with pagination and filtering
router.get("/", getNotifications);

// Get unread notification count
router.get("/unread/count", getUnreadCount);

// Mark notification as read
router.put("/:notificationId/read", markNotificationRead);

// Mark all notifications as read
router.patch("/read-all", markAllNotificationsRead);

// Delete notification
router.delete("/:notificationId", deleteNotification);

// Clear all notifications
router.delete("/", clearAllNotifications);

export default router;
