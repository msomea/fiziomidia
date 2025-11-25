import express from "express";
import { 
  createConversation,
  getConversations,
  getConversationWithUser
} from "../controllers/conversationController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();
//api/conversations/

// Create new conversation
router.post("/", authenticate, createConversation);

// Get all conversations for logged in user
router.get("/", authenticate, getConversations);

// Get conversation with specific user
router.get("/user/:id", authenticate, getConversationWithUser);

export default router;
