import ClinicPromotion from "../../models/ClinicPromotion.js";
import User from "../../models/User.js";
import { CacheService } from "../../utils/redis.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../services/uploadService.js";
import {
  logAdminActivity,
  getClinicPromotionTargetInfo,
} from "../../middlewares/adminActivityLogger.js";

/*
========================================
GET SINGLE PROMOTION (ADMIN VIEW)
========================================
*/
export const getClinicPromotionByIdAdmin = async (req, res) => {
  try {
    const promotion = await ClinicPromotion.findById(req.params.id)
    .populate({
      path: "clinic",
      select: "name address ownerUserId",
      populate: {
        path: "ownerUserId",
        select: "fullName email phone",
        model: "User"
      }
    })

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    res.json({ promotion });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
========================================
GET ALL PROMOTIONS (ADMIN VIEW)
========================================
*/
export const getAllClinicPromotionsAdmin = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const promotions = await ClinicPromotion.find(filter)
      .populate({
        path: "clinic",
        select: "name address ownerUserId",
        populate: {
          path: "ownerUserId",
          select: "fullName email phone",
          model: "User"
        }
      })
      .sort({ createdAt: -1 });

    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
========================================
APPROVE & ACTIVATE PROMOTION
========================================
*/
export const approveClinicPromotion = [
  logAdminActivity("CLINIC_PROMOTION_APPROVED", getClinicPromotionTargetInfo),
  async (req, res) => {
    try {
      const promotion = await ClinicPromotion.findById(req.params.id);

      if (!promotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }

      promotion.status = "active";

      // Optional: reset start date when approved
      promotion.startAt = new Date();

      await promotion.save();

      // Invalidate admin dashboard cache due to clinic promotion approval
      await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
      console.log(
        `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to clinic promotion approval`,
      );

      res.json({
        message: "Clinic promotion approved and activated",
        promotion,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
];

/*
========================================
REJECT PROMOTION
========================================
*/
export const rejectClinicPromotion = [
  logAdminActivity("CLINIC_PROMOTION_REJECTED", getClinicPromotionTargetInfo),
  async (req, res) => {
    try {
      const promotion = await ClinicPromotion.findById(req.params.id);

      if (!promotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }

      promotion.status = "suspended";

      await promotion.save();

      // Invalidate admin dashboard cache due to clinic promotion rejection
      await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
      console.log(
        `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to clinic promotion rejection`,
      );

      res.json({
        message: "Clinic promotion rejected/suspended",
        promotion,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
];

/*
========================================
MANUAL EXPIRE PROMOTION
========================================
*/
export const expireClinicPromotion = [
  logAdminActivity("CLINIC_PROMOTION_EXPIRED", getClinicPromotionTargetInfo),
  async (req, res) => {
    try {
      const promotion = await ClinicPromotion.findById(req.params.id);

      if (!promotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }

      promotion.status = "expired";
      await promotion.save();

      // Invalidate admin dashboard cache due to clinic promotion expiration
      await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
      console.log(
        `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to clinic promotion expiration`,
      );

      res.json({
        message: "Promotion expired manually",
        promotion,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
];

/*
========================================
SET PRIORITY SCORE (VERY IMPORTANT)
========================================
*/
export const setClinicPromotionPriority = [
  logAdminActivity(
    "CLINIC_PROMOTION_PRIORITY_UPDATED",
    getClinicPromotionTargetInfo,
  ),
  async (req, res) => {
    try {
      const { priorityScore } = req.body;

      const promotion = await ClinicPromotion.findById(req.params.id);

      if (!promotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }

      promotion.priorityScore = priorityScore;
      await promotion.save();

      // Invalidate admin dashboard cache due to priority score update
      await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
      console.log(
        `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to priority score update`,
      );

      res.json({
        message: "Priority score updated",
        promotion,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
];

/*
========================================
GET PROMOTION ANALYTICS
========================================
*/
export const getClinicPromotionAnalytics = async (req, res) => {
  try {
    const promotion = await ClinicPromotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    const ctr =
      promotion.impressions > 0
        ? (promotion.clicks / promotion.impressions) * 100
        : 0;

    res.json({
      clicks: promotion.clicks,
      impressions: promotion.impressions,
      ctr: ctr.toFixed(2) + "%",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
========================================
UPDATE PROMOTION (ADMIN VIEW)
========================================
*/
export const updateClinicPromotionAdmin = async (req, res) => {
  try {
    const { status, endAt } = req.body;

    const promotion = await ClinicPromotion.findById(req.params.id).populate(
      "clinic",
    );

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    // Update only provided fields
    if (status) promotion.status = status;
    if (endAt) promotion.endAt = new Date(endAt);

    await promotion.save();

    // Invalidate admin dashboard cache due to clinic promotion update
    await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
    console.log(
      `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to clinic promotion update`,
    );

    res.json({
      message: "Clinic promotion updated successfully",
      promotion,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
========================================
TRACK CLICK (ADMIN VIEW)
========================================
*/
export const trackClinicPromotionClickAdmin = async (req, res) => {
  try {
    const promotion = await ClinicPromotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    promotion.clicks += 1;
    await promotion.save();

    // Invalidate admin dashboard cache due to click tracking
    await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
    console.log(
      `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to click tracking`,
    );

    res.json({ message: "Click tracked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
========================================
TRACK IMPRESSION (ADMIN VIEW)
========================================
*/
export const trackClinicPromotionImpressionAdmin = async (req, res) => {
  try {
    const promotion = await ClinicPromotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    promotion.impressions += 1;
    await promotion.save();

    // Invalidate admin dashboard cache due to impression tracking
    await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
    console.log(
      `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to impression tracking`,
    );

    res.json({ message: "Impression tracked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
========================================
DELETE PROMOTION
========================================
*/
export const deleteClinicPromotion = [
  logAdminActivity("CLINIC_PROMOTION_DELETED", getClinicPromotionTargetInfo),
  async (req, res) => {
    try {
      const promotion = await ClinicPromotion.findById(req.params.id);

      if (!promotion) {
        return res.status(404).json({ message: "Promotion not found" });
      }

      // Clean up associated image if it exists
      if (promotion.imagePublicId) {
        try {
          await deleteFromCloudinary(promotion.imagePublicId);
        } catch (error) {
          console.error("Failed to delete image from Cloudinary:", error);
          // Continue with deletion even if image cleanup fails
        }
      }

      await ClinicPromotion.findByIdAndDelete(req.params.id);

      res.json({
        message: "Clinic promotion deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
];