import express from "express";
import { authenticate, authenticateAdmin } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import { requireForumPermission } from "../middlewares/forumPermissions.js";
import * as forum from "../controllers/forumController.js";
import * as comment from "../controllers/forumCommentController.js";
import * as modReq from "../controllers/modReqController.js";
import { getForumPageData } from "../controllers/forumPageController.js";
import { getPTSubmanagementData } from "../controllers/ptSubmanagementController.js";
import { upload } from "../services/uploadService.js";
import { limiters } from "../utils/rateLimiter.js";

const router = express.Router();

/* -------------------------------
   Forum Subforums & Posts
--------------------------------*/

// 📖 Public routes
router.get("/subs", forum.listSubs);
router.get("/subs/:id", forum.getSubById);
router.get("/subs/:subId/posts", forum.listPosts);
router.get("/posts/:id", forum.getPostById); 

// 🚀 Consolidated Forum Page API
router.get("/subs/:subId/forum-page", authenticate, getForumPageData);

// 🚀 Consolidated PT Submanagement Page API
router.get("/subs/:subId/management", authenticate, getPTSubmanagementData);

// 🧠 Authenticated actions
router.post("/posts/:id/vote", authenticate, forum.votePost);
router.post("/subs", authenticate, requireRole("physiotherapist", "admin"), forum.createSub);
router.post(
  "/posts",
  authenticate,
  limiters.forumPost,
  upload.single("image"),
  forum.createPost,
);
router.delete("/posts/:id", authenticate, forum.deletePost);
router.put("/posts/:id", authenticate, forum.updatePost);
router.get("/my-subs", authenticate, forum.getMySubs);
// Check if current user is already a mod or has pending request
router.get("/subs/:subId/my-mod-request", authenticate, modReq.checkMyModStatus);
// Request to become sub moderator
router.post("/subs/:subId/mod-requests", authenticate, modReq.createModRequest);
router.get("/subs/:subId/mod-requests", authenticate, modReq.listModRequestsBySub);
// Pin/Unpin a post
router.put("/posts/:subId/pin", authenticate, forum.togglePinPost);
// Edit Sub (Admin, Mod, Sub Owner only)
router.put("/subs/:subId", authenticate, forum.editSub);
// Upadete Sub Mod Requests (Admin, Sub Owner only)
router.patch("/subs/:subId/mod-requests/:requestId", authenticate, forum.updateModRequestRoleByOwner);

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
router.get("/posts/:id/comments", comment.listComments);
router.post(
  "/posts/:id/comments",
  authenticate,
  limiters.forumComment,
  comment.addComment,
);
router.put("/posts/:id/comments/:commentId", authenticate, comment.updateComment);
router.delete("/posts/:id/comments/:commentId", authenticate, comment.deleteComment);

export default router;
