import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import * as userController from "../controllers/userController.js";
import { upload } from "../services/uploadService.js";
import { getSavedPTsByMember } from "../controllers/ptController.js";

const router = express.Router();


// routes /api/users

// Get current user profile
router.get("/profile", authenticate, userController.getProfile);

// Update current user profile
router.put(
  "/profile",
  authenticate,
  // accept both avatar and licenseDocument uploads in same request
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "licenseDocument", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  userController.updateProfile
);

// Public: get profile by ID
router.get("/:id", userController.getUserById);

// Get saved PTs for a member
router.get("/:id/saved-pts", authenticate, requireRole("member", "admin"), getSavedPTsByMember );

export default router;