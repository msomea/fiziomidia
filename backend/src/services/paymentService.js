// Stripe integration placeholder. Use this to implement full Stripe logic.
import Stripe from "stripe";
import config from "../config/index.js";

const stripe = new Stripe(
  config.stripe?.secretKey || "sk_test_key_placeholder",
  {
    apiVersion: "2022-11-15",
  },
);

async function createCheckoutSession({ priceId, successUrl, cancelUrl }) {
  // Real impl: stripe.checkout.sessions.create({...})
  return { id: "cs_test_dummy", url: successUrl };
}

export default { createCheckoutSession, stripe };
