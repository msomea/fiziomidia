import express from "express";
import * as auth from "../controllers/authController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// /api/auth routes
router.post("/register", auth.registerUser);
router.post("/login", auth.loginUser);
router.post("/refresh", auth.refreshToken);
router.post("/logout", authenticate, auth.logoutUser);

router.get("/me", authenticate, auth.getCurrentUser);

export default router;
