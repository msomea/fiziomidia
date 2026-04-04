import express from "express";
import { authenticate } from "../middlewares/auth.js";
import * as ptPromo from "../controllers/ptPromotionController.js";
import * as clinicPromo from "../controllers/clinicPromotionController.js";
import { upload } from "../services/uploadService.js";

const router = express.Router();

// /api/promotions
/*
========================================
PT PROMOTIONS
========================================
*/
// Get active PT promotions (public)
router.get("/pt", ptPromo.getPTPromotion)

// Get a specific PT promotion by ID
router.get("/pt/:id", ptPromo.getPromotionById);

// Create a PT promotion (requires authentication)
router.post("/pt/create", authenticate, upload.single("image"),  ptPromo.createPromotion);

// Stripe webhook (no auth needed)
router.post(
  "/pt/webhook",
  express.raw({ type: "application/json" }),
  ptPromo.stripeWebhook,
);

/*
========================================
CLINIC PROMOTIONS
========================================
*/
// Get active clinic promotions (public)
router.get("/clinic", clinicPromo.getActiveClinicPromotions);

// Get my clinic promotions (authenticated)
router.get(
  "/clinic/my-promotions",
  authenticate,
  clinicPromo.getMyClinicPromotions,
);

// Create a clinic promotion
router.post(
  "/clinic",
  authenticate,
  upload.single("image"),
  clinicPromo.createClinicPromotion,
);

// Get a specific clinic promotion by ID
router.get("/clinic/:id", clinicPromo.getClinicPromotionById);

// Update a clinic promotion
router.put(
  "/clinic/:id",
  authenticate,
  upload.single("image"),
  clinicPromo.updateClinicPromotion,
);

// Delete a clinic promotion
router.delete("/clinic/:id", authenticate, clinicPromo.deleteClinicPromotion);

// Track click
router.post("/clinic/:id/click", clinicPromo.trackClinicPromotionClick);

// Track impression
router.post("/clinic/:id/impression", clinicPromo.trackClinicPromotionImpression);

export default router;
