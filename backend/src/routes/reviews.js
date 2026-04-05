import express from "express";
import {
  getReviewsByClinic,
  getReviewsByPhysiotherapist,
  createReview,
  updateReview,
  deleteReview,
  getUserReviews,
} from "../controllers/reviewController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Get reviews for a specific clinic
router.get("/clinic/:clinicId", getReviewsByClinic);

// Get reviews for a specific physiotherapist
router.get("/physiotherapist/:physiotherapistId", getReviewsByPhysiotherapist);

// Get current user's reviews
router.get("/my-reviews", authenticate, getUserReviews);

// Create a new review (protected)
router.post("/", authenticate, createReview);

// Update a review (protected)
router.put("/:reviewId", authenticate, updateReview);

// Delete a review (protected)
router.delete("/:reviewId", authenticate, deleteReview);

export default router;
