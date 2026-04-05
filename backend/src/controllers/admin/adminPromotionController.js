import User from "../../models/User.js";
import PTPromotion from "../../models/PTPromotion.js";
import { CacheService } from "../../utils/redis.js";
import escapeRegExp from "../../utils/escapeRegExp.js";
import {
  logAdminActivity,
  getPromotionTargetInfo,
} from "../../middlewares/adminActivityLogger.js";
import { deleteFromCloudinary } from "../../services/uploadService.js";

// -----------------------------------------
// PT PROMOTIONS CONTROLLER
// -----------------------------------------

export const getAllPromotions = async (req, res) => {
  try {
    const { search, status } = req.query;

    let ptIds = [];

    if (search) {
      const esc = escapeRegExp(search);
      const pts = await User.find({
        role: "physiotherapist",
        $or: [
          { fullName: { $regex: esc, $options: "i" } },
          { email: { $regex: esc, $options: "i" } },
        ],
      }).select("_id");
      ptIds = pts.map((p) => p._id);
    }

    // Main promotion query
    const query = {};

    if (ptIds.length > 0) {
      query.pt = { $in: ptIds };
    }

    if (status) {
      query.status = status;
    }

    const promotions = await PTPromotion.find(query)
      .populate("pt", "fullName email")
      .sort({ createdAt: -1 });

    res.json({ promotions });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get one Promotion
export const getAdminPromotion = async (req, res) => {
  try {
    const promotion = await PTPromotion.findById(req.params.id)
      .populate("pt", "fullName email");

    res.json({ promotion });
  } catch {
    res.status(500).json({ message: "Unable to fetch promotion" });
  }
};

//UPDATE PROMOTION
export const updateAdminPromotion = [
  logAdminActivity("PROMOTION_UPDATED", getPromotionTargetInfo),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, endAt } = req.body;

      const promotion = await PTPromotion.findById(id);
      if (!promotion)
        return res.status(404).json({ message: "Promotion not found" });

      // Update end date if provided
      if (endAt) {
        const formattedEndAt = new Date(endAt);
        if (isNaN(formattedEndAt)) {
          return res.status(400).json({ message: "Invalid endAt date format" });
        }
        promotion.endAt = formattedEndAt;
      }

      // Determine current status
      const now = new Date();

      if (status === "suspended") {
        // Suspended promotions stay suspended until reactivated
        promotion.status = "suspended";
      } else if (promotion.endAt && promotion.endAt < now) {
        // If endAt is past, mark as expired
        promotion.status = "expired";
      } else {
        // Otherwise active
        promotion.status = "active";
      }

      await promotion.save();

      // Invalidate admin dashboard cache due to promotion update
      await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
      console.log(
        `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to promotion update`,
      );

      return res.json({
        message: "Promotion updated successfully",
        promotion,
      });
    } catch (err) {
      console.error("Update promotion error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
];

// DELETE PROMOTION
export const deleteAdminPromotion = [
  logAdminActivity("PROMOTION_DELETED", getPromotionTargetInfo),
  async (req, res) => {
    try {
      const promotion = await PTPromotion.findById(req.params.id);
      if (promotion?.imagePublicId) {
        await deleteFromCloudinary(promotion.imagePublicId);
      }
      await PTPromotion.findByIdAndDelete(req.params.id);
      res.json({ message: "Promotion deleted" });
    } catch {
      res.status(500).json({ message: "Delete failed" });
    }
  },
];
