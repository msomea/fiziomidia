import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { getMessages, sendMessage, deleteMessage } from "../controllers/messageController.js";
import { limiters } from "../utils/rateLimiter.js";

const router = express.Router();

// routes /api/messages

// Authenticated users only
router.get("/:chatId", authenticate, getMessages);
router.delete("/:id", authenticate, deleteMessage);
router.post("/", authenticate, limiters.message, sendMessage);
export default router;
