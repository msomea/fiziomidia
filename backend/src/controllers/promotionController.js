import Promotion from "../models/Promotion.js";
import User from "../models/User.js";
import Stripe from "stripe";
import config from "../config/index.js";
import dayjs from "dayjs"

const stripe = new Stripe(config.stripe.secretKey);

// Create a promotion (creates a pending promotion and Stripe checkout session)
export const createPromotionCheckout = async (req, res) => {
  try {
    const { durationDays = 7, price = 1000 } = req.body; // price in smallest currency unit

    // Create a pending promotion
    const promotion = new Promotion({
      pt: req.user._id,
      status: "pending", // will be updated via webhook
      startAt: null,
      endAt: null,
    });

    await promotion.save();

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "PT Promotion",
              description: `Promotion for ${durationDays} days`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      success_url: `${config.clientUrl}/promotion-success`,
      cancel_url: `${config.clientUrl}/promotion-cancel`,
      metadata: {
        promotionId: promotion._id.toString(),
        ptId: req.user._id.toString(),
        durationDays,
      },
    });

    res.status(201).json({ promotion, checkoutUrl: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create promotion checkout" });
  }
};

// Stripe webhook to activate/mark promotions
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, config.stripe.webhookSecret);
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

    const promotion = await Promotion.findOne({
      pt: ptId,
      status: "active",
    });

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
    console.log("Returned data", promotion)
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


