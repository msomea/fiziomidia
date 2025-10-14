import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  createPromotionCheckout,
  getPromotions,
  stripeWebhook,
} from "../controllers/promotionController.js";

const router = express.Router();

// List promotions
router.get("/", getPromotions);

// Get a specific promotion by ID
router.get("/:id", getPromotions);

// Create a promotion (requires authentication)
router.post("/create-checkout-session", authenticate, createPromotionCheckout);

// Stripe webhook (no auth needed)
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

export default router;
