import express from "express";
import rateLimit  from "express-rate-limit";
import { sendContactEmail } from "../controllers/contactController.js";

const router = express.Router();

// Rate limiter: max 2 requests per 10 per IP
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 2,
  keyGenerator: (req) => {
    return (
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
      req.ip
    );
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      type: "RATE_LIMIT",
      code: "RATE_LIMIT_CONTACT",
    });
  },
});

router.use(contactLimiter);
router.post("/", sendContactEmail);

export default router;