import express from "express";
import ratelimit  from "express-rate-limit";
import { sendContactEmail } from "../controllers/contactController.js";

const router = express.Router();

// Rate limiter: max 2 requests per 10 per IP
const contactLimiter = ratelimit({
  windowMs: 10 * 60 * 1000, // 1 hour
  max: 2,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again after an 10 minutes",
  },
});

router.use(contactLimiter);
router.post("/", sendContactEmail);

export default router;