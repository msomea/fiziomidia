import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  createPromotionCheckout,
  getPromotions,
  stripeWebhook,
  getPTPromotion
} from "../controllers/promotionController.js";

const router = express.Router();


// routes /api/promotions

// List promotions
router.get("/", getPromotions);

// Get a specific promotion by ID
router.get("/:id", getPromotions);

// Create a promotion (requires authentication)
router.post("/create-checkout-session", authenticate, createPromotionCheckout);

// Stripe webhook (no auth needed)
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

// Get promotions by PT
router.get("/")
export default router;
