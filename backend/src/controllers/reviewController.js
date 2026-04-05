import Review from "../models/Review.js";
import Clinic from "../models/Clinic.js";
import User from "../models/User.js";

export const getReviewsByClinic = async (req, res) => {
  try {
    const { clinicId } = req.params;
    
    const reviews = await Review.find({ clinic: clinicId })
      .populate('reviewer', 'fullName email')
      .populate('physiotherapist', 'fullName email')
      .sort({ createdAt: -1 });
    
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching clinic reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

export const createReview = async (req, res) => {
  try {
    const { clinicId, rating, comment, appointmentId } = req.body;
    const userId = req.user._id;

    if (!clinicId || !rating) {
      return res.status(400).json({ error: "Clinic and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Check if user already reviewed this clinic
    const existingReview = await Review.findOne({
      reviewer: userId,
      clinic: clinicId
    });

    if (existingReview) {
      return res.status(400).json({ error: "You have already reviewed this clinic" });
    }

    // Create the review
    const review = new Review({
      reviewer: userId,
      clinic: clinicId,
      appointment: appointmentId || null,
      rating,
      comment: comment || ""
    });

    await review.save();

    // Update clinic rating
    await updateClinicRating(clinicId);

    // Populate response data
    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'fullName email')
      .populate('physiotherapist', 'fullName email');

    res.status(201).json(populatedReview);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if user owns this review
    if (review.reviewer.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized to update this review" });
    }

    const updateData = {};
    if (rating) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;

    const updatedReview = await Review.findByIdAndUpdate(reviewId, updateData, {
      new: true
    }).populate('reviewer', 'fullName email')
      .populate('physiotherapist', 'fullName email');

    // Update clinic rating
    await updateClinicRating(review.clinic);

    res.json(updatedReview);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if user owns this review
    if (review.reviewer.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this review" });
    }

    const clinicId = review.clinic;
    await Review.findByIdAndDelete(reviewId);

    // Update clinic rating
    await updateClinicRating(clinicId);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;

    const reviews = await Review.find({ reviewer: userId })
      .populate('clinic', 'name address')
      .populate('physiotherapist', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// Helper function to update clinic rating
const updateClinicRating = async (clinicId) => {
  try {
    const reviews = await Review.find({ clinic: clinicId });
    
    if (reviews.length === 0) {
      await Clinic.findByIdAndUpdate(clinicId, {
        'rating.average': 0,
        'rating.count': 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Clinic.findByIdAndUpdate(clinicId, {
      'rating.average': averageRating,
      'rating.count': reviews.length
    });
  } catch (error) {
    console.error("Error updating clinic rating:", error);
  }
};
