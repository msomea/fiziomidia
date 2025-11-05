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

/* -------------------------------
   Forum Subforums & Posts
--------------------------------*/

// 📖 Public routes
router.get("/subs", forum.listSubs);
router.get("/subs/:id", forum.getSubById);
router.get("/subs/:subId/posts", forum.listPosts);
router.get("/posts/:id", forum.getPostById); 

// 🧠 Authenticated actions
router.post("/posts/:id/vote", authenticate, forum.votePost);
router.post("/subs", authenticate, requireRole("physiotherapist", "admin"), forum.createSub);
router.post("/posts", authenticate, forum.createPost);
router.delete("/subs/:id", authenticateAdmin, forum.deleteSub); // admin only
router.delete("/posts/:id", authenticate, forum.deletePost);
router.put("/posts/:id", authenticate, forum.updatePost);

/* -------------------------------
   Sponsorship Management
--------------------------------*/
router.put("/subs/:id/sponsorship", authenticate, forum.updateSubSponsorship);
router.put("/subs/:id/sponsorship/remove", authenticate, forum.removeSubSponsorship);

/* -------------------------------
   Physiotherapist Forum Activity
--------------------------------*/

// 🔹 Get all PT posts (paginated, e.g. PT forum page)
router.get("/pt/:ptId", authenticate, forum.getPostsByPTId);

// 🔹 Get last N posts by PT (dashboard view)
router.get("/", authenticate, forum.getPTPosts);

/* -------------------------------
   Comments
--------------------------------*/
router.get("/posts/:id/comments", listComments);
router.post("/posts/:id/comments", authenticate, addComment);
router.delete("/comments/:id", authenticate, deleteComment);

export default router;
