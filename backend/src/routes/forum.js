import express from "express";
import { authenticate, authenticateAdmin } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roles.js";
import { requireForumPermission } from "../middlewares/forumPermissions.js";
import * as forum from "../controllers/forumController.js";
import * as comment from "../controllers/forumCommentController.js";
import * as modReq from "../controllers/modReqController.js";

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
router.delete("/posts/:id", authenticate, requireForumPermission(["owner", "mod", "sub_mod"]), forum.deletePost);
router.put("/posts/:id", authenticate, forum.updatePost);

// Check if current user is already a mod or has pending request
router.get("/subs/:subId/my-mod-request", authenticate, modReq.checkMyModStatus);
// Request to become sub moderator
router.post("/subs/:subId/mod-requests", authenticate, modReq.createModRequest);
router.get("/subs/:subId/mod-request", authenticate, modReq.listModRequestsBySub);

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
router.post("/posts/:id/comments", authenticate, comment.addComment);
router.put("/posts/:id/comments/:commentId", authenticate, comment.updateComment);
router.delete("/posts/:id/comments/:commentId", authenticate, comment.deleteComment);

export default router;
