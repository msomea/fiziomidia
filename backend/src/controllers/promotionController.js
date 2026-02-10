import Promotion from "../models/Promotion.js";
import User from "../models/User.js";
import Stripe from "stripe";
import config from "../config/index.js";
import { uploadToCloudinary } from "../services/uploadService.js";
import dayjs from "dayjs"

const stripe = new Stripe(config.stripe.secretKey);

// Create a promotion (creates a pending promotion and Stripe checkout session)

const TITLE_CONFIG = {
  Silver: { duration: 7, price: 5000 },
  Gold: { duration: 14, price: 12000 },
  Platinum: { duration: 30, price: 25000 },
};

export const createPromotion = async (req, res) => {
  try {
    const { title, description } = req.body;
    const pt = req.user;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    if (!["Silver", "Gold", "Platinum"].includes(title)) {
      return res.status(400).json({ error: "Invalid title" });
    }

    // Set duration and price based on title
    const { duration, price } = TITLE_CONFIG[title];

    let imageUrl = pt.profileImageUrl; // fallback
    let imagePublicId = null;

    // Upload image to Cloudinary if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file);
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const promotion = new Promotion({
      pt: pt._id,
      title,
      description,
      duration,
      price,
      imageUrl,
      imagePublicId,
      startAt: new Date(),
      // endAt will be calculated by schema pre-save hook
    });

    await promotion.save();

    res.status(201).json({
      message: "Promotion created successfully",
      promotion,
    });
  } catch (err) {
    console.error("❌ Create promotion error:", err);
    res.status(500).json({ error: "Failed to create promotion" });
  }
};

// Stripe webhook to activate/mark promotions
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // express.raw middleware sets req.body to a Buffer for this route
    const raw = req.body;
    event = stripe.webhooks.constructEvent(
      raw,
      sig,
      config.stripe.webhookSecret,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { promotionId, ptId, durationDays = 7 } = session.metadata;

      const startAt = new Date();
      const endAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      const promotion = await Promotion.findByIdAndUpdate(
        promotionId,
        { status: "active", startAt, endAt },
        { new: true }
      );

      // Update PT profile
      const user = await User.findById(ptId);
      if (user) {
        user.ptProfile = user.ptProfile || {};
        user.ptProfile.promotionActiveUntil = endAt;
        await user.save();
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/promotions?ptId=<id> Returns active promotion
export const getPTPromotion = async (req, res) => {
  try {
    const { ptId } = req.query;
    if (!ptId) return res.status(400).json({ error: "ptId is required" });

    const promotion = await Promotion.findOne({ pt: ptId, status: "active" })
      //.populate("pt", "fullName profileImageUrl");

    if (!promotion) {
      return res.json({ active: false });
    }

    const endDate = promotion.endAt;
    const today = dayjs();
    const daysLeft = dayjs(endDate).diff(today, "day");

    res.json({
      active: true,
      promotion,
      daysLeft,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch promotion" });
  }
};

// Returns a single promotion by its _id
export const getPromotionById = async (req, res) => {
  try {
    const promotionId = req.params.id;

    if (!promotionId) {
      return res.status(400).json({ error: "Promotion ID is required" });
    }

    const promotion = await Promotion.findById(promotionId).populate("pt", "fullName email"); // optional: include PT info

    if (!promotion) {
      return res.status(404).json({ error: "Promotion not found" });
    }

    res.json({ promotion });
  } catch (err) {
    console.error("Failed to fetch promotion:", err);
    res.status(500).json({ error: "Failed to fetch promotion" });
  }
};


