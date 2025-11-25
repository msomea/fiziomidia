import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { getMessages, sendMessage, deleteMessage } from "../controllers/messageController.js";

const router = express.Router();

// routes /api/messages

// Authenticated users only
router.get("/:chatId", authenticate, getMessages);
router.delete("/:id", authenticate, deleteMessage);
router.post("/", authenticate, sendMessage);
export default router;
