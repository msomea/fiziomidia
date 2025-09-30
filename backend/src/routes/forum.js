import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import {
  listSubs,
  getSubById,
  createSub,
  createPost,
  listPosts,
} from "../controllers/forumController.js";

const router = express.Router();

// Public: anyone can view subs and posts
router.get("/subs", listSubs);
router.get("/subs/:id", getSubById);
router.get("/subs/:subId/posts", listPosts);

// Authenticated PT/Admin: create subs or posts
router.post("/subs", authenticate, requireRole("physiotherapist", "admin"), createSub );
router.post("/posts", authenticate, createPost); // optionally restrict to PT/Admin
export default router;
