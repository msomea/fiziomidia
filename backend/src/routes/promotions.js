import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import {
  getPromotions,
  createPromotion,
} from "../controllers/promotionController.js";

const router = express.Router();

// Public: view promotions
router.get("/", getPromotions);

// PT only: create promotion
router.post("/", authenticate, requireRole("physiotherapist"), createPromotion);

export default router;
