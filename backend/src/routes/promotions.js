import express from "express";
import { authenticate } from "../middlewares/auth.js";
import * as promo from "../controllers/promotionController.js";
import { upload } from "../services/uploadService.js";

const router = express.Router();


// routes /api/promotions
// Get a specific promotion by ID
router.get("/:id", promo.getPromotionById);

// Create a promotion (requires authentication)
router.post("/create", authenticate, upload.single("image"),  promo.createPromotion);

// Stripe webhook (no auth needed)
router.post("/webhook", express.raw({ type: "application/json" }), promo.stripeWebhook);

// Get promotions by PT
router.get("/", authenticate, promo.getPTPromotion)

export default router;
