import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import * as ptController from "../controllers/ptController.js";
import { getPTDashboardData, getPTDashboardStats } from "../controllers/ptDashboardController.js";

const router = express.Router();

// routes /api/pts
// public list
router.get("/",authenticate, ptController.listPts);

// Get all physiotherapists (PTs) with active promotions
router.get("/promotions", ptController.getPTsWithActivePromotions);

// Get PT dashboard stats (MUST come before /:id)
router.get("/:id/dashboard-stats",  getPTDashboardStats)

// Consolidated PT Dashboard API (MUST come before /:id)
router.get("/:id/dashboard", authenticate, getPTDashboardData);

// get pt by id (MUST come last)
router.get("/:id", ptController.getPTById);

// update pt (owner or admin)
router.put("/:id", authenticate, requireRole("physiotherapist", "admin"), ptController.updatePTProfile);

export default router;
