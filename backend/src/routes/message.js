import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { getMessages, sendMessage, deleteMessage } from "../controllers/messageController.js";

const router = express.Router();

// routes /api/messages

// Authenticated users only
router.get("/:chatId", authenticate, getMessages);
router.post("/", authenticate, sendMessage);
router.delete("/:id", authenticate, deleteMessage);

export default router;
