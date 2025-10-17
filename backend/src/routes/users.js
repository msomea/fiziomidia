import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import * as userController from "../controllers/userController.js";
import { getSavedPTsByMember } from "../controllers/ptController.js";

const router = express.Router();


// routes /api/users

// Public: get profile by ID
router.get("/:id", userController.getUserById);

// Get current user profile
router.get("/profile", authenticate, userController.getProfile);

// Update current user profile
router.put("/profile", authenticate, userController.updateProfile);

// List all users (admin only)
router.get("/", authenticate, requireRole("admin"), userController.listUsers);

// Get saved PTs for a member
router.get("/:id/saved-pts", authenticate, requireRole("member", "admin"), getSavedPTsByMember );

export default router;