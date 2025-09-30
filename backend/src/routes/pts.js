import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import { listPts, getPTById, updatePTProfile } from "../controllers/ptController.js";

const router = express.Router();

// public list
router.get("/", listPts);
router.get("/:id", getPTById);


// update pt (owner or admin)
router.put("/:id", authenticate, requireRole("physiotherapist", "admin"), updatePTProfile);

export default router;
