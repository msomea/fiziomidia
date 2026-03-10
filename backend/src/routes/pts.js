import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import * as ptController from "../controllers/ptController.js";
import { getPTDashboardData } from "../controllers/ptDashboardController.js";

const router = express.Router();

// routes /api/pts
// public list
router.get("/",authenticate, ptController.listPts);

// Get all physiotherapists (PTs) with active promotions
router.get("/promotions", ptController.getPTsWithActivePromotions);

// get pt by id
router.get("/:id", ptController.getPTById);

// update pt (owner or admin)
router.put("/:id", authenticate, requireRole("physiotherapist", "admin"), ptController.updatePTProfile);

// get pt dashboard stats (legacy)
router.get("/:id/dashboard-stats",  ptController.getPTDashboardStats)

// Consolidated PT Dashboard API
router.get("/:id/dashboard", authenticate, getPTDashboardData);

export default router;

// get member saved pt
router.get("/users/:id/saved-pts", ptController.getSavedPTsByMember)

