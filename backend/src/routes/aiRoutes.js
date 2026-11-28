import express from "express";
import { authenticate, authenticateOptional, authenticateAdmin } from "../middlewares/auth.js";
import { limiters } from "../utils/rateLimiter.js";
import * as ai from "../controllers/aiController.js";

const router = express.Router();

/* ---------------- Public chat (guests + members) ---------------- */
router.post(
  "/chat",
  authenticateOptional,
  limiters.aiChat,
  ai.chat,
);

router.get("/chat/quota", authenticateOptional, ai.getGuestQuota);
router.get("/conversations", authenticateOptional, ai.listConversations);
router.get("/conversations/:id", authenticateOptional, ai.getConversation);
router.patch("/conversations/:id", authenticateOptional, ai.renameConversation);
router.delete(
  "/conversations/:id",
  authenticateOptional,
  ai.deleteConversation,
);
router.post("/feedback", authenticateOptional, ai.submitFeedback);

// Authenticated: transfer guest conversations into the user's account
router.post("/conversations/claim", authenticate, ai.claimGuestConversations);

/* ---------------- Admin-only ---------------- */
router.use(authenticate, authenticateAdmin, limiters.admin);

router.get("/status", ai.getStatus);
router.get("/usage", ai.getUsageDashboard);
router.get("/config", ai.getConfig);
router.put("/config", ai.updateConfig);
router.post("/test-connection", ai.testConnection);

// Manual triggers (testing / on-demand generation)
router.post("/forum/draft", ai.triggerForumDraft);
router.post("/admin/report", ai.triggerAdminReport);

// Virtual Administrator — daily report + activity (Phase 3, read-only)
router.get("/admin/daily-report", ai.getDailyReport);
router.get("/admin/activity", ai.listActivity);

// Generated content review workflow
router.get("/content", ai.listGeneratedContent);
router.put("/content/:id/review", ai.reviewGeneratedContent);

// Knowledge documents
router.get("/knowledge", ai.listKnowledgeDocuments);
router.post("/knowledge/ingest", ai.ingestKnowledgeDocument);
router.post("/knowledge/upload", ai.uploadKnowledgeDocument);
router.put("/knowledge/:id", ai.updateKnowledgeDocument);

// Activity log
router.get("/activity", ai.listActivity);

export default router;
