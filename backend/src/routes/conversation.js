import express from "express";
import { 
  createConversation,
  getConversations,
  getConversationWithUser,
  deleteConversation,
  updateUnreadCount
} from "../controllers/conversationController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();
//api/conversations/

// Create new conversation
router.post("/", authenticate, createConversation);

// Get all conversations for logged in user
router.get("/", authenticate, getConversations);

// Get conversation with specific user (MUST come before /:id)
router.get("/user/:id", authenticate, getConversationWithUser);

// Update Unread counter (MUST come before /:id)
router.put("/:id/mark-read", authenticate, updateUnreadCount)

// Delete a conversation by ID (MUST come last)
router.delete("/:id", authenticate, deleteConversation);

export default router;
