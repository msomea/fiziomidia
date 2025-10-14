import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import {
  listSubs,
  getSubById,
  createSub,
  createPost,
  listPosts,
  votePost,
  getPostById,
} from "../controllers/forumController.js";

import {
  listComments,
  addComment,
  deleteComment,
} from "../controllers/forumCommentController.js";

const router = express.Router();

// --- Forum Subs & Posts ---
// Public routes
router.get("/subs", listSubs);
router.get("/subs/:id", getSubById);
router.get("/subs/:subId/posts", listPosts);

// Optional auth for getting single post
router.get("/posts/:id", getPostById);

// Authenticated actions (vote, create)
router.post("/posts/:id/vote", authenticate, votePost);
router.post("/subs", authenticate, requireRole("physiotherapist", "admin"), createSub);
router.post("/posts", authenticate, createPost);

// --- Comments ---
// Get comments for a post (public)
router.get("/posts/:postId/comments", listComments);

// Add comment (auth required)
router.post("/posts/:postId/comments", authenticate, addComment);

// Delete comment (owner/admin)
router.delete("/comments/:id", authenticate, deleteComment);

export default router;
