import crypto from "crypto";
import AIConfiguration from "../models/AIConfiguration.js";
import AIConversation from "../models/AIConversation.js";
import AIMessage from "../models/AIMessage.js";
import AIGeneratedContent from "../models/AIGeneratedContent.js";
import AIActivityLog from "../models/AIActivityLog.js";
import AIKnowledgeDocument from "../models/AIKnowledgeDocument.js";
import Post from "../models/Post.js";
import ForumSub from "../models/ForumSub.js";
import { CacheService } from "../utils/redis.js";
import redisClient from "../utils/redis.js";
import { notifyContentReview } from "../ai/services/approvalService.js";
import { handleChat } from "../ai/agents/physiotherapyAgent.js";
import { generateDraft } from "../ai/agents/forumContentAgent.js";
import { generateReport } from "../ai/agents/virtualAdminAgent.js";
import { getAllUsage, getUsage, getDailyCap } from "../ai/core/usageTracker.js";
import { ingestDocument } from "../ai/knowledge/ingestKnowledge.js";
import { extractTextFromBuffer } from "../ai/knowledge/extractText.js";
import { knowledgeUpload } from "../ai/knowledge/knowledgeUpload.js";
import { isAIAvailable, getAgentConfig } from "../ai/core/promptManager.js";
import { ping } from "../ai/core/aiProvider.js";
import { AGENTS } from "../ai/core/agentManager.js";

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error("AI controller error:", err);
    res.status(500).json({ success: false, error: "Internal AI error" });
  }
};

/* ---------------- Chat (public, optional auth) ---------------- */

const GUEST_DAILY_LIMIT = 10;

// Guest daily allowance resets at midnight Africa/Dar_es_Salaam (Tanzania).
const darEsSalaamDay = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Dar_es_Salaam" });

const guestQuotaKey = (guestToken) =>
  `ai:guest:${guestToken}:${darEsSalaamDay()}`;

// Guest daily message cap — Redis counter keyed by guestToken + TZ date.
// Fails open (allows) if Redis is down so guests aren't hard-blocked.
const checkGuestQuota = async (guestToken) => {
  if (!guestToken) return { allowed: true };
  const key = guestQuotaKey(guestToken);
  try {
    const count = await redisClient.incr(key);
    if (count === 1) await redisClient.expire(key, 60 * 60 * 36); // ~36h covers TZ drift
    return {
      allowed: count <= GUEST_DAILY_LIMIT,
      used: count,
      cap: GUEST_DAILY_LIMIT,
    };
  } catch (err) {
    console.warn("Guest quota check failed (allowing):", err.message);
    return { allowed: true };
  }
};

// Peek at remaining allowance without consuming a message.
const peekGuestQuota = async (guestToken) => {
  if (!guestToken)
    return { used: 0, cap: GUEST_DAILY_LIMIT, remaining: GUEST_DAILY_LIMIT };
  try {
    const used = parseInt(
      (await redisClient.get(guestQuotaKey(guestToken))) || "0",
      10,
    );
    return {
      used,
      cap: GUEST_DAILY_LIMIT,
      remaining: Math.max(0, GUEST_DAILY_LIMIT - used),
    };
  } catch {
    return { used: 0, cap: GUEST_DAILY_LIMIT, remaining: GUEST_DAILY_LIMIT };
  }
};

export const chat = handle(async (req, res) => {
  const {
    message,
    language = null,
    conversationId = null,
    guestToken = null,
  } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return res
      .status(400)
      .json({ success: false, error: "message is required" });
  }
  if (message.length > 4000) {
    return res
      .status(400)
      .json({ success: false, error: "message too long (max 4000 chars)" });
  }

  // Guests get a server-issued token so their conversations stay private
  // to their browser (stored in localStorage on the frontend).
  const isGuest = !req.user;
  const effectiveGuestToken = isGuest
    ? typeof guestToken === "string" && guestToken.length <= 128
      ? guestToken
      : crypto.randomUUID()
    : null;

  let guestQuota = null;
  if (isGuest) {
    const quota = await checkGuestQuota(effectiveGuestToken);
    if (!quota.allowed) {
      return res.status(429).json({
        success: false,
        error: "Daily guest limit reached",
        code: "AI_GUEST_LIMIT",
        guestToken: effectiveGuestToken,
        guestQuota: { used: quota.cap, cap: quota.cap, remaining: 0 },
      });
    }
    guestQuota = {
      used: quota.used ?? 0,
      cap: quota.cap,
      remaining: Math.max(0, quota.cap - (quota.used ?? 0)),
    };
  }

  const result = await handleChat({
    message: message.trim(),
    user: req.user || null,
    language: ["en", "sw"].includes(language) ? language : null,
    conversationId,
    guestToken: effectiveGuestToken,
  });

  if (!result.ok) {
    const status =
      result.code === "AI_QUOTA_EXCEEDED"
        ? 429
        : result.code === "AI_NOT_CONFIGURED" || result.code === "DISABLED"
          ? 503
          : 502;
    return res
      .status(status)
      .json({ success: false, error: result.error, code: result.code });
  }

  res.json({
    success: true,
    conversationId: result.conversationId,
    messageId: result.messageId,
    reply: result.reply,
    model: result.model,
    language: result.language,
    sources: result.sources || [],
    escalated: result.escalated || false,
    guestToken: effectiveGuestToken,
    guestQuota,
  });
});

// Remaining guest allowance — does not consume a message.
export const getGuestQuota = handle(async (req, res) => {
  const guestToken =
    typeof req.query.guestToken === "string" ? req.query.guestToken : null;
  if (req.user) return res.json({ success: true, guestQuota: null });
  res.json({ success: true, guestQuota: await peekGuestQuota(guestToken) });
});

export const listConversations = handle(async (req, res) => {
  const userId = req.user?._id;
  const guestToken =
    typeof req.query.guestToken === "string" ? req.query.guestToken : null;
  const filter = userId ? { user: userId } : { user: null, guestToken };
  const conversations = await AIConversation.find(filter)
    .sort({ updatedAt: -1 })
    .limit(50)
    .select("title language status createdAt updatedAt")
    .lean();
  res.json({ success: true, conversations });
});

export const getConversation = handle(async (req, res) => {
  const userId = req.user?._id;
  const guestToken =
    typeof req.query.guestToken === "string" ? req.query.guestToken : null;
  const conversation = await AIConversation.findOne({
    _id: req.params.id,
    user: userId ?? null,
    ...(userId ? {} : { guestToken }),
  }).lean();
  if (!conversation)
    return res.status(404).json({ success: false, error: "Not found" });

  const messages = await AIMessage.find({ conversation: conversation._id })
    .sort({ createdAt: 1 })
    .select("role content sources model feedback createdAt")
    .lean();

  res.json({ success: true, conversation, messages });
});

// Rename a conversation — owner-scoped (user account or guestToken).
export const renameConversation = handle(async (req, res) => {
  const { title } = req.body || {};
  if (
    !title ||
    typeof title !== "string" ||
    !title.trim() ||
    title.length > 120
  ) {
    return res
      .status(400)
      .json({ success: false, error: "title is required (max 120 chars)" });
  }
  const userId = req.user?._id;
  const guestToken =
    typeof req.query.guestToken === "string" ? req.query.guestToken : null;
  const filter = {
    _id: req.params.id,
    user: userId ?? null,
    ...(userId ? {} : { guestToken }),
  };
  const conv = await AIConversation.findOneAndUpdate(
    filter,
    { title: title.trim() },
    { new: true },
  )
    .select("title language status createdAt updatedAt")
    .lean();
  if (!conv)
    return res.status(404).json({ success: false, error: "Not found" });
  res.json({ success: true, conversation: conv });
});

// Delete a conversation and its messages — owner-scoped.
export const deleteConversation = handle(async (req, res) => {
  const userId = req.user?._id;
  const guestToken =
    typeof req.query.guestToken === "string" ? req.query.guestToken : null;
  const filter = {
    _id: req.params.id,
    user: userId ?? null,
    ...(userId ? {} : { guestToken }),
  };
  const conv = await AIConversation.findOne(filter).select("_id").lean();
  if (!conv)
    return res.status(404).json({ success: false, error: "Not found" });
  await AIMessage.deleteMany({ conversation: conv._id });
  await AIConversation.deleteOne({ _id: conv._id });
  res.json({ success: true });
});

// Claim guest conversations into the authenticated user's account.
export const claimGuestConversations = handle(async (req, res) => {
  const { guestToken } = req.body || {};
  if (!guestToken || typeof guestToken !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "guestToken is required" });
  }
  const result = await AIConversation.updateMany(
    { user: null, guestToken },
    { $set: { user: req.user._id, guestToken: null } },
  );
  res.json({ success: true, claimed: result.modifiedCount });
});

export const submitFeedback = handle(async (req, res) => {
  const { messageId, feedback } = req.body || {};
  if (!["helpful", "not_helpful"].includes(feedback)) {
    return res
      .status(400)
      .json({ success: false, error: "feedback must be helpful|not_helpful" });
  }
  const msg = await AIMessage.findByIdAndUpdate(
    messageId,
    { feedback },
    { new: true },
  ).select("conversation feedback");
  if (!msg)
    return res.status(404).json({ success: false, error: "Message not found" });
  res.json({ success: true });
});

/* ---------------- Admin: status & config ---------------- */

export const getStatus = handle(async (req, res) => {
  const availability = await isAIAvailable();
  const usage = await getAllUsage();
  const agents = {};
  for (const name of AGENTS) {
    const cfg = await getAgentConfig(name);
    agents[name] = {
      enabled: cfg.enabled,
      model: cfg.model,
      ...usage[name],
    };
  }
  res.json({
    success: true,
    available: availability.ok,
    reason: availability.reason,
    agents,
  });
});

/* ---------------- Admin: usage dashboard ---------------- */

// Local-day boundary matching usageTracker's todayKey (server-local date)
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getUsageDashboard = handle(async (req, res) => {
  const usage = await getAllUsage();
  const today = startOfToday();
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);

  const [todayAgg, weekAgg] = await Promise.all([
    AIActivityLog.aggregate([
      { $match: { createdAt: { $gte: today } } },
      {
        $group: {
          _id: "$agent",
          requests: { $sum: 1 },
          tokens: { $sum: { $ifNull: ["$tokensUsed", 0] } },
        },
      },
    ]),
    AIActivityLog.aggregate([
      { $match: { createdAt: { $gte: weekStart } } },
      {
        $group: {
          _id: {
            agent: "$agent",
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          },
          requests: { $sum: 1 },
          tokens: { $sum: { $ifNull: ["$tokensUsed", 0] } },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]),
  ]);

  const todayByAgent = Object.fromEntries(todayAgg.map((a) => [a._id, a]));

  const agents = {};
  for (const name of AGENTS) {
    const q = usage[name] || { used: 0, cap: 0, remaining: 0 };
    const t = todayByAgent[name] || { requests: 0, tokens: 0 };
    agents[name] = {
      quotaUsed: q.used,
      dailyCap: q.cap,
      quotaRemaining: q.remaining,
      loggedRequests: t.requests,
      tokensToday: t.tokens,
      avgTokensPerRequest:
        t.requests > 0 ? Math.round(t.tokens / t.requests) : 0,
    };
  }

  const daily = weekAgg.map((d) => ({
    date: d._id.day,
    agent: d._id.agent,
    requests: d.requests,
    tokens: d.tokens,
  }));

  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  res.json({
    success: true,
    date: localDate,
    agents,
    daily,
  });
});

export const getConfig = handle(async (req, res) => {
  let config = await AIConfiguration.findOne().lean();
  if (!config) {
    config = {
      enabled: true,
      agents: AGENTS.map((name) => ({
        name,
        enabled: true,
        model: null,
        dailyRequestCap: null,
        systemPrompt: null,
        schedule: null,
      })),
      safetyClassifierEnabled: true,
      knowledgeRetrievalEnabled: true,
      adminEmail: null,
    };
  }
  res.json({ success: true, config });
});

export const updateConfig = handle(async (req, res) => {
  const {
    enabled,
    agents,
    safetyClassifierEnabled,
    knowledgeRetrievalEnabled,
    adminEmail,
  } = req.body || {};

  const update = {};
  if (typeof enabled === "boolean") update.enabled = enabled;
  if (typeof safetyClassifierEnabled === "boolean")
    update.safetyClassifierEnabled = safetyClassifierEnabled;
  if (typeof knowledgeRetrievalEnabled === "boolean")
    update.knowledgeRetrievalEnabled = knowledgeRetrievalEnabled;
  if (typeof adminEmail === "string") update.adminEmail = adminEmail || null;

  if (Array.isArray(agents)) {
    // Merge per-agent fields; only known agents allowed
    const existing = await AIConfiguration.findOne();
    const merged = (existing?.agents || AGENTS.map((name) => ({ name }))).map(
      (a) => ({ ...(a.toObject?.() ?? a) }),
    );
    for (const incoming of agents) {
      if (!AGENTS.includes(incoming.name)) continue;
      const idx = merged.findIndex((a) => a.name === incoming.name);
      const patch = {};
      if (typeof incoming.enabled === "boolean")
        patch.enabled = incoming.enabled;
      if (typeof incoming.model === "string" || incoming.model === null)
        patch.model = incoming.model || null;
      if (
        typeof incoming.dailyRequestCap === "number" ||
        incoming.dailyRequestCap === null
      )
        patch.dailyRequestCap = incoming.dailyRequestCap;
      if (
        typeof incoming.systemPrompt === "string" ||
        incoming.systemPrompt === null
      )
        patch.systemPrompt = incoming.systemPrompt;
      if (typeof incoming.schedule === "string" || incoming.schedule === null)
        patch.schedule = incoming.schedule;
      if (idx >= 0) merged[idx] = { ...merged[idx], ...patch };
      else merged.push({ name: incoming.name, enabled: true, ...patch });
    }
    update.agents = merged;
  }

  const config = await AIConfiguration.findOneAndUpdate(
    {},
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  await AIActivityLog.create({
    agent: "system",
    action: "CONFIG_UPDATED",
    actor: req.user._id,
    details: { keys: Object.keys(update) },
  });

  res.json({ success: true, config });
});

export const testConnection = handle(async (req, res) => {
  const model = req.body?.model || null;
  const target = model || (await getAgentConfig("physiotherapy")).model;
  try {
    const text = await ping(target);
    res.json({ success: true, model: target, response: text });
  } catch (err) {
    res.status(502).json({
      success: false,
      model: target,
      error: err.message,
      code: err.code,
    });
  }
});

/* ---------------- Admin: manual triggers (testing) ---------------- */

export const triggerForumDraft = handle(async (req, res) => {
  const { forumSubId } = req.body || {};
  if (!forumSubId)
    return res
      .status(400)
      .json({ success: false, error: "forumSubId required" });
  const result = await generateDraft(forumSubId);
  if (!result.ok) {
    const status = result.code === "AI_QUOTA_EXCEEDED" ? 429 : 502;
    return res
      .status(status)
      .json({ success: false, error: result.error, code: result.code });
  }
  await notifyContentReview(result.draft);
  res.json({ success: true, draft: result.draft });
});

export const triggerAdminReport = handle(async (req, res) => {
  const result = await generateReport();
  if (!result.ok) {
    const status = result.code === "AI_QUOTA_EXCEEDED" ? 429 : 502;
    return res
      .status(status)
      .json({ success: false, error: result.error, code: result.code });
  }
  res.json({ success: true, report: result.report, stats: result.stats });
});

/* ---------------- Admin: content review ---------------- */

export const listGeneratedContent = handle(async (req, res) => {
  const { status, agent, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (agent) filter.agent = agent;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [items, total] = await Promise.all([
    AIGeneratedContent.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate("forumSub", "title")
      .populate("reviewedBy", "name email")
      .lean(),
    AIGeneratedContent.countDocuments(filter),
  ]);
  res.json({
    success: true,
    items,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
  });
});

export const reviewGeneratedContent = handle(async (req, res) => {
  const { action, notes, title, body } = req.body || {};
  if (!["approve", "reject", "regenerate"].includes(action)) {
    return res.status(400).json({
      success: false,
      error: "action must be approve|reject|regenerate",
    });
  }
  const content = await AIGeneratedContent.findById(req.params.id);
  if (!content)
    return res.status(404).json({ success: false, error: "Content not found" });

  const statusMap = {
    approve: "approved",
    reject: "rejected",
    regenerate: "regeneration_requested",
  };
  content.status = statusMap[action];
  content.reviewedBy = req.user._id;
  content.reviewedAt = new Date();
  content.reviewNotes = notes || null;
  if (typeof title === "string" && title.trim()) content.title = title.trim();
  if (typeof body === "string" && body.trim()) content.body = body.trim();

  // Approve → publish as a real forum post (forumContent agent only).
  // The approving admin is recorded as author; the AIActivityLog entry
  // below preserves the AI provenance trail.
  if (
    action === "approve" &&
    content.agent === "forumContent" &&
    content.forumSub
  ) {
    const post = new Post({
      title: content.title,
      body: content.body,
      sub: content.forumSub,
      author: req.user._id,
    });
    await post.save();
    await ForumSub.findByIdAndUpdate(content.forumSub, {
      $inc: { totalPosts: 1 },
    });
    await CacheService.delPattern(`forum:sub:${content.forumSub}*`);
    content.publishedPost = post._id;
    content.status = "published";
  }

  // Regenerate → produce a fresh draft for the same subcategory and
  // notify admins again. Old draft stays as regeneration_requested.
  let newDraft = null;
  if (
    action === "regenerate" &&
    content.agent === "forumContent" &&
    content.forumSub
  ) {
    const result = await generateDraft(content.forumSub);
    if (result.ok) {
      newDraft = result.draft;
      await notifyContentReview(newDraft);
    }
  }

  await content.save();

  await AIActivityLog.create({
    agent: content.agent,
    action: `CONTENT_${action.toUpperCase()}ED`,
    actor: req.user._id,
    generatedContent: content._id,
    details: {
      notes,
      publishedPost: content.publishedPost || null,
      newDraftId: newDraft?._id || null,
    },
  });

  res.json({ success: true, content, newDraft });
});

/* ---------------- Admin: knowledge documents ---------------- */

export const listKnowledgeDocuments = handle(async (req, res) => {
  const { status, specialty, language, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (specialty) filter.specialty = specialty;
  if (language) filter.language = language;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [items, total] = await Promise.all([
    AIKnowledgeDocument.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean(),
    AIKnowledgeDocument.countDocuments(filter),
  ]);
  res.json({
    success: true,
    items,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
  });
});

export const updateKnowledgeDocument = handle(async (req, res) => {
  const allowed = [
    "status",
    "approvedForAI",
    "approvedForPublicDisplay",
    "clinicalReviewer",
    "languageReviewer",
    "reviewedAt",
    "nextReviewAt",
    "reviewNotes",
    "title",
    "conditionTags",
    "targetAudience",
  ];
  const patch = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) patch[key] = req.body[key];
  }
  const doc = await AIKnowledgeDocument.findByIdAndUpdate(
    req.params.id,
    { $set: patch },
    { new: true, runValidators: true },
  );
  if (!doc)
    return res
      .status(404)
      .json({ success: false, error: "Document not found" });

  await AIActivityLog.create({
    agent: "system",
    action: "KNOWLEDGE_DOC_UPDATED",
    actor: req.user._id,
    details: { documentId: doc.documentId, fields: Object.keys(patch) },
  });

  res.json({ success: true, document: doc });
});
export const ingestKnowledgeDocument = handle(async (req, res) => {
  const { text, ...meta } = req.body || {};
  const required = [
    "documentId",
    "title",
    "specialty",
    "language",
    "documentType",
    "source",
  ];
  const missing = required.filter((k) => !meta[k]);
  if (missing.length) {
    return res
      .status(400)
      .json({ success: false, error: `Missing fields: ${missing.join(", ")}` });
  }
  if (!text || typeof text !== "string" || text.trim().length < 100) {
    return res
      .status(400)
      .json({ success: false, error: "text content required (min 100 chars)" });
  }
  try {
    const { document, chunkCount } = await ingestDocument({ ...meta, text });
    await AIActivityLog.create({
      agent: "system",
      action: "KNOWLEDGE_INGESTED",
      actor: req.user._id,
      details: { documentId: document.documentId, chunkCount },
    });
    res.json({ success: true, document, chunkCount });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
const csv = (v) =>
  typeof v === "string" && v.trim()
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

export const uploadKnowledgeDocument = [
  knowledgeUpload.single("file"),
  handle(async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded (field name: file)" });
    }
    const b = req.body || {};
    const required = [
      "documentId",
      "title",
      "specialty",
      "language",
      "documentType",
    ];
    const missing = required.filter((k) => !b[k]);
    if (missing.length) {
      return res.status(400).json({
        success: false,
        error: `Missing fields: ${missing.join(", ")}`,
      });
    }

    let text;
    try {
      text = await extractTextFromBuffer(
        req.file.buffer,
        req.file.originalname,
      );
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: `Text extraction failed: ${err.message}`,
      });
    }
    if (!text || text.trim().length < 100) {
      return res.status(400).json({
        success: false,
        error: "Extracted text too short (min 100 chars)",
      });
    }

    try {
      const { document, chunkCount } = await ingestDocument({
        documentId: b.documentId,
        title: b.title,
        specialty: b.specialty,
        conditionTags: csv(b.conditionTags),
        language: b.language,
        documentType: b.documentType,
        targetAudience: csv(b.targetAudience),
        source: {
          organization: b.sourceOrganization || "Unknown",
          documentTitle: b.sourceDocumentTitle || null,
          url: b.sourceUrl || null,
          publicationDate: b.publicationDate
            ? new Date(b.publicationDate)
            : null,
          licence: b.licence || "To be verified",
        },
        text,
        fileRef: `upload:${req.file.originalname}`,
      });
      await AIActivityLog.create({
        agent: "system",
        action: "KNOWLEDGE_INGESTED",
        actor: req.user._id,
        details: {
          documentId: document.documentId,
          chunkCount,
          file: req.file.originalname,
        },
      });
      res.json({ success: true, document, chunkCount });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }),
];

/* ---------------- Admin: activity log ---------------- */

export const listActivity = handle(async (req, res) => {
  const {
    agent,
    action,
    requiresHumanReview,
    page = 1,
    limit = 50,
  } = req.query;
  const filter = {};
  if (agent) filter.agent = agent;
  if (action) filter.action = action;
  if (requiresHumanReview === "true") filter.requiresHumanReview = true;
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [items, total] = await Promise.all([
    AIActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate("actor", "name email")
      .lean(),
    AIActivityLog.countDocuments(filter),
  ]);
  res.json({
    success: true,
    items,
    total,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
  });
});

// Latest stored daily report (Phase 3) — read-only
export const getDailyReport = handle(async (req, res) => {
  const log = await AIActivityLog.findOne({
    agent: "virtualAdmin",
    action: "REPORT_GENERATED",
  })
    .sort({ createdAt: -1 })
    .lean();
  if (!log) {
    return res.json({ success: true, report: null });
  }
  res.json({
    success: true,
    report: {
      text: log.details?.report || null,
      stats: log.details?.stats || null,
      anomalies: log.details?.anomalies || [],
      generatedAt: log.createdAt,
      model: log.model,
    },
  });
});
