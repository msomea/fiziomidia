import express from "express";
import ratelimit  from "express-rate-limit";
import { sendContactEmail } from "../controllers/contactController.js";

const router = express.Router();

// Rate limiter: max 2 requests per 10 per IP
const contactLimiter = ratelimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      type: "RATE_LIMIT",
      code: "RATE_LIMIT_CONTACT"
    });
  },
});

router.use(contactLimiter);
router.post("/", sendContactEmail);

export default router;