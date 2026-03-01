import express from "express";
import rateLimit from "express-rate-limit";
import * as auth from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Middleware
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      type: "RATE_LIMIT",
      code: "RATE_LIMIT_LOGIN",
    });
  },
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      type: "RATE_LIMIT",
      code: "RATE_LIMIT_REGISTER",
    });
  },
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      type: "RATE_LIMIT",
      code: "RATE_LIMIT_RESET"
    });
  },
})


// /api/auth routes
router.post("/register", registerLimiter, auth.registerUser);
router.post("/login", loginLimiter, auth.loginUser);
router.post("/refresh", auth.refreshToken);
router.post("/logout", authenticate, auth.logoutUser);
router.get("/me", authenticate, auth.getCurrentUser);

router.get("/verify-email/:token", auth.verifyEmail);
router.post("/forgot-password", resetLimiter, auth.requestPasswordReset);
router.post("/reset-password/:token", auth.resetPassword);

export default router;
