import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import * as userController from "../controllers/userController.js";

const router = express.Router();

// Get current user profile
router.get("/profile", authenticate, userController.getProfile);

// Update current user profile
router.put("/profile", authenticate, userController.updateProfile);

// List all users (admin only)
router.get("/", authenticate, requireRole("admin"), userController.listUsers);

export default router;
