import Promotion from "../models/Promotion.js";
import User from "../models/User.js";
import Stripe from "stripe";
import config from "../config/index.js";

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

      console.log(`Promotion ${promotionId} activated for PT ${ptId}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// List all promotions (admin or general view)
export const getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate("pt", "fullName email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ promotions });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch promotions" });
  }
};
