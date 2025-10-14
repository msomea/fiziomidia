import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { getMessages, sendMessage, deleteMessage } from "../controllers/messageController.js";

const router = express.Router();

// Authenticated users only
router.get("/:chatId", authenticate, getMessages);
router.post("/", authenticate, sendMessage);

// Delete a message by ID
router.delete("/:id", authenticate, deleteMessage);

export default router;
