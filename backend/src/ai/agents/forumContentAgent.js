import mongoose from "mongoose";
import ForumSub from "../../models/ForumSub.js";
import Post from "../../models/Post.js";
import AIGeneratedContent from "../../models/AIGeneratedContent.js";
import AIActivityLog from "../../models/AIActivityLog.js";
import { runAgent } from "../core/agentManager.js";

/*
Forum Content Agent — Phase 0 stub.
Phase 2 implements: scheduler, dedupe, full generation pipeline,
approval emails, publish-on-approve.
This stub provides the generation entry point used by tests/admin.
*/

/**
 * Generate a draft topic for a forum subcategory.
 * Saves as AIGeneratedContent with status "pending_review" — NEVER publishes.
 * @param {string|mongoose.Types.ObjectId} forumSubId
 */
export const generateDraft = async (forumSubId) => {
  const sub = await ForumSub.findById(forumSubId).lean();
  if (!sub) return { ok: false, error: "Forum subcategory not found", code: "FORUM_SUB_NOT_FOUND" };

  // Recent posts for dedupe context
  const recentPosts = await Post.find({ sub: forumSubId })
    .sort({ createdAt: -1 })
    .limit(15)
    .select("title")
    .lean();
  const recentTitles = recentPosts.map((p) => p.title).join("\n- ");

  const prompt = `Create one educational discussion topic for the FizioMidia physiotherapy forum, written in proper, fluent Kiswahili (Swahili).

Forum subcategory: "${sub.name}"

Recently published topics (DO NOT repeat or closely duplicate these):
- ${recentTitles || "(none)"}

Requirements:
- Title (Kichwa): clear, engaging, under 120 characters, in Kiswahili
- Body (Mwili): 150-300 words of accurate patient-education content in fluent Kiswahili, ending with a discussion question
- The ENTIRE output must be in Kiswahili — no English text
- Format your response EXACTLY as:
KICHWA: <title in Kiswahili>
MWILI:
<body in Kiswahili>`;

  const result = await runAgent("forumContent", prompt, {
    maxOutputTokens: 1200,
    temperature: 0.8,
  });

  if (!result.ok) {
    await AIActivityLog.create({
      agent: "forumContent",
      action: "CONTENT_GENERATION_FAILED",
      details: { forumSubId: String(forumSubId), code: result.code, error: result.error },
      requiresHumanReview: result.code === "AI_QUOTA_EXCEEDED",
    });
    return { ok: false, error: result.error, code: result.code };
  }

  // Parse KICHWA:/MWILI: (or TITLE:/BODY:) format — tolerant fallback
  const titleMatch = result.text.match(/^(?:KICHWA|TITLE):\s*(.+)$/im);
  const bodyMatch = result.text.match(/(?:MWILI|BODY):\s*([\s\S]+)$/i);
  const title = titleMatch ? titleMatch[1].trim() : `Majadiliano: ${sub.name}`;
  const body = bodyMatch ? bodyMatch[1].trim() : result.text;

  const draft = await AIGeneratedContent.create({
    agent: "forumContent",
    forumSub: forumSubId,
    title,
    body,
    language: "sw",
    status: "pending_review",
    model: result.model,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
  });

  await AIActivityLog.create({
    agent: "forumContent",
    action: "CONTENT_GENERATED",
    generatedContent: draft._id,
    model: result.model,
    tokensUsed: (result.promptTokens || 0) + (result.completionTokens || 0),
  });

  return { ok: true, draft };
};
