import express from "express";
import { authenticate, authenticateAdmin } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import * as forum from "../controllers/forumController.js";

import {
  listComments,
  addComment,
  deleteComment,
} from "../controllers/forumCommentController.js";

const router = express.Router();

// /api/forum
// --- Forum Subs & Posts ---
// Public routes
router.get("/subs", forum.listSubs);
router.get("/subs/:id", forum.getSubById);
router.get("/subs/:subId/posts", forum.listPosts);

// Optional auth for getting single post
router.get("/posts/:id", forum.getPostById);

// Authenticated actions (vote, create)
router.post("/posts/:id/vote", authenticate, forum.votePost);
router.post("/subs", authenticate, requireRole("physiotherapist", "admin"), forum.createSub);
router.post("/posts", authenticate, forum.createPost);
router.delete("/subs/:id", authenticateAdmin, forum.deleteSub); // Admin only
// Delete post
router.delete("/posts/:id", authenticate, forum.deletePost)
// Sub Sponsoship
// Update / Add sponsorship
router.put("/subs/:id/sponsorship", forum.updateSubSponsorship);
// Remove sponsorship
router.put("/subs/:id/sponsorship/remove", forum.removeSubSponsorship);

// Get last N forum posts by PT
// ?ptId=<id>&limit=3
router.get("/", authenticate, forum.getPTPosts);
export default router;

// Get all PT posts with pagination
// GET /api/forum/pt/:ptId
router.get("/pt/:ptId", authenticate, forum.getPostsByPTId)


// --- Comments ---
// Get comments for a post (public)
router.get("/posts/:postId/comments", listComments);

// Add comment (auth required)
router.post("/posts/:postId/comments", authenticate, addComment);

// Delete comment (owner/admin)
router.delete("/comments/:id", authenticate, deleteComment);

