import express from "express";
import * as auth from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";
import { limiters } from "../utils/rateLimiter.js";

const router = express.Router();

// /api/auth routes
router.post("/register", limiters.register, auth.registerUser);
router.post("/login", limiters.login, auth.loginUser);
router.post("/refresh", limiters.refreshToken, auth.refreshToken);
router.post("/logout", authenticate, auth.logoutUser);
router.get("/me", authenticate, auth.getCurrentUser);

router.get("/verify-email/:token", limiters.passwordReset, auth.verifyEmail);
router.post(
  "/forgot-password",
  limiters.passwordReset,
  auth.requestPasswordReset,
);
router.post(
  "/reset-password/:token",
  limiters.passwordReset,
  auth.resetPassword,
);

export default router;
