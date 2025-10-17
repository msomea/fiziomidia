import express from "express";
import { authenticate, authenticateAdmin } from "../middlewares/auth.js";
import {
  updateSponsorship,
  removeSponsorship
} from "../controllers/adminController.js";

const router = express.Router();
// route /api/admin
// 🔹 All routes require admin authentication
// router.use(authenticate, authenticateAdmin);

// Update / Add sponsorship
router.put("/subs/:id/sponsorship", updateSponsorship);

// Remove sponsorship
router.put("/subs/:id/sponsorship/remove", removeSponsorship);

export default router;
