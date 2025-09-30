import Promotion from "../models/Promotion.js";
import User from "../models/User.js";

// Create a new promotion (for PT)
export const createPromotion = async (req, res) => {
  try {
    const { durationDays = 7 } = req.body;

    const startAt = new Date();
    const endAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const promotion = new Promotion({
      pt: req.user._id,
      startAt,
      endAt,
      active: true,
    });

    await promotion.save();

    // Update user's PT profile
    const user = await User.findById(req.user._id);
    if (user) {
      user.ptProfile = user.ptProfile || {};
      user.ptProfile.promotionActiveUntil = endAt;
      await user.save();
    }

    res.status(201).json({ promotion });
  } catch (err) {
    res.status(500).json({ error: "Failed to create promotion" });
  }
};

// List all promotions
export const getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate("pt", "fullName email") // optional fields
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ promotions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
};
