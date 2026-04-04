import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import * as userController from "../controllers/userController.js";
import { upload } from "../services/uploadService.js";
import { getSavedPTsByMember } from "../controllers/ptController.js";
import { getMemberDashboardData } from "../controllers/memberDashboardController.js";

const router = express.Router();


// routes /api/users
// Get all users (for messaging)
router.get("/", authenticate, userController.getAllUsers);

// Get current user profile
router.get("/profile", authenticate, userController.getProfile);

// Consolidated Member Dashboard API
router.get("/dashboard", authenticate, getMemberDashboardData);

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

// Get saved PTs for a member (MUST come before /:id)
router.get("/:id/saved-pts", authenticate, getSavedPTsByMember );

// Save PT to member's saved list
router.post("/save-pt/:ptId", authenticate, requireRole("member"), userController.toggleSavePT);

// Public: get profile by ID (MUST come last)
router.get("/:id", userController.getUserById);

// Update preferred language
router.put("/update-language", authenticate, userController.updateLanguage);

export default router;