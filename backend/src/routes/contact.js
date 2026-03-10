import express from "express";
import { sendContactEmail } from "../controllers/contactController.js";
import { limiters } from "../utils/rateLimiter.js";

const router = express.Router();

router.use(limiters.contact);
router.post("/", sendContactEmail);

export default router;
