import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { getMessages, sendMessage } from "../controllers/messageController.js";

const router = express.Router();

// Authenticated users only
router.get("/:chatId", authenticate, getMessages);
router.post("/", authenticate, sendMessage);

export default router;
