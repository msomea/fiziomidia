import express from "express";
import { register, login, refresh } from "../controllers/authController.js"; // named imports

const router = express.Router();

// routes /api/auth
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

router.get("/me", (req, res) => {
  res.json({ id: 1, username: "testuser", email: "user@gmail.com" });
});              

export default router; 
