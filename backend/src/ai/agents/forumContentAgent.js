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
  if (!sub)
    return {
      ok: false,
      error: "Forum subcategory not found",
      code: "FORUM_SUB_NOT_FOUND",
    };

  // Recent posts for dedupe context
  const recentPosts = await Post.find({ sub: forumSubId })
    .sort({ createdAt: -1 })
    .limit(15)
    .select("title")
    .lean();
  const recentTitles = recentPosts.map((p) => p.title).join("\n- ");

  // Rejected drafts — cheap avoid-list so the agent doesn't reproduce them
  const rejected = await AIGeneratedContent.find({
    agent: "forumContent",
    forumSub: forumSubId,
    status: { $in: ["rejected", "regeneration_requested"] },
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("title reviewNotes")
    .lean();
  const rejectedList = rejected
    .map(
      (r) =>
        `- "${r.title}"${r.reviewNotes ? ` (rejected because: ${r.reviewNotes})` : ""}`,
    )
    .join("\n");

  const subTitle = sub.title?.sw || sub.title?.en || sub.title || "general";
  const prompt = `You are an experienced Kiswahili health educator writing for the FizioMidia physiotherapy community forum. Write ONE in-depth educational discussion post in fluent, natural Kiswahili about a topic relevant to "${subTitle}".

Recently published topics (DO NOT repeat or closely duplicate these):
- ${recentTitles || "(none)"}

STRUCTURE — follow this proven format used by our most-read posts:
1. KICHWA (title): catchy, under 120 characters, may use CAPS for emphasis, in Kiswahili.
Previously REJECTED drafts for this subforum — do NOT reuse these topics, angles, or repeat the same mistakes:
${rejectedList || "(none)"}

2. MWILI (body), 400-600 words, MUST contain ALL of these sections in order:
   a. Opening hook: a common myth or question patients ask (e.g. "Je, kila mgonjwa ... anahitaji ...?")
   b. Short background: explain the condition/problem in simple terms (2-3 short paragraphs)
   c. 3-5 numbered sections ("1.", "2.", ...) each with a clear sub-heading line, covering causes, what helps, what does NOT help, and when to see a professional
   d. Use short bullet lists (lines starting with "- ") for symptoms, exercises, or warnings
   e. A "Tahadhari" or warnings paragraph about what patients/families should avoid
   f. Closing: key takeaway message + one open discussion question for readers

STYLE EXAMPLE (structure only — write your OWN topic, do NOT copy this):
"Je, kila mgonjwa aliyepata kiharusi anahitaji kufanyiwa masaji?\n\nKiharusi (Stroke) ni tatizo linalotokea pale damu inaposhindwa kufika vizuri kwenye sehemu ya ubongo...\n\nKatika jamii zetu, kuna dhana kwamba... Lakini je, hii ni kweli?\n\nJibu ni HAPANA...\n\n1. Kwa nini masaji si tiba kuu ya kiharusi?\nKiharusi husababisha madhara kwenye ubongo...\n- Kupungua kwa nguvu za misuli\n- Kupooza upande mmoja wa mwili\n- Kukakamaa kwa misuli\n\n2. Ni matibabu gani yana umuhimu zaidi baada ya kiharusi?\nTiba ya Fiziotherapia (Physiotherapy) ni sehemu muhimu...\n\n3. Tahadhari kwa wagonjwa na walezi\n- Epuka kukanda au kuvuta kwa nguvu...\n- Usilazimishe kiungo kilichokakamaa...\n\nUjumbe muhimu: Kumsaidia mtu aliyepata kiharusi hakumaanishi kumfanyia masaji kila siku... Je, unajuaje wewe kuhusu matibabu ya kiharusi katika jamii yako?"

RULES:
- The ENTIRE output must be in Kiswahili — no English sentences (medical terms in brackets are OK)
- Be accurate, safe, and encouraging; never diagnose or prescribe
- Write the FULL body — do not stop early, do not summarize, do not use placeholders
- NO MARKDOWN — the forum is plain text. Never use **bold**, *italic*, # headers, inline code, or [links](url). Write list items as plain lines starting with "- " followed by a short phrase, e.g.:
  - Kuongezeka kwa uvimbe
  - Maumivu yanayozidi baada ya saa 48
  NOT like: "- **Kipengele (Kingine):** maelezo marefu..."
- Format your response EXACTLY as:
KICHWA: <title in Kiswahili>
MWILI:
<full body in Kiswahili>`;

  const runOnce = () =>
    runAgent("forumContent", prompt, {
      maxOutputTokens: 10000,
      temperature: 0.8,
    });

  let result = await runOnce();
  // One automatic retry on timeout/empty — generation is slow but valuable
  if (
    !result.ok &&
    (result.code === "AI_TIMEOUT" || result.code === "AI_EMPTY_RESPONSE")
  ) {
    result = await runOnce();
  }

  if (!result.ok) {
    await AIActivityLog.create({
      agent: "forumContent",
      action: "CONTENT_GENERATION_FAILED",
      details: {
        forumSubId: String(forumSubId),
        code: result.code,
        error: result.error,
      },
      requiresHumanReview: result.code === "AI_QUOTA_EXCEEDED",
    });
    return { ok: false, error: result.error, code: result.code };
  }

  // Parse KICHWA:/MWILI: (or TITLE:/BODY:) format — tolerant fallback
  const titleMatch = result.text.match(/^(?:KICHWA|TITLE):\s*(.+)$/im);
  const bodyMatch = result.text.match(/(?:MWILI|BODY):\s*([\s\S]+)$/i);
  const title = titleMatch ? titleMatch[1].trim() : `Majadiliano: ${subTitle}`;
  let body = bodyMatch ? bodyMatch[1].trim() : result.text;

  // Guard against truncated/empty generations (e.g. body = "K")
  if (body.length < 300) {
    await AIActivityLog.create({
      agent: "forumContent",
      action: "CONTENT_GENERATION_FAILED",
      details: {
        forumSubId: String(forumSubId),
        code: "CONTENT_TOO_SHORT",
        error: `Generated body too short (${body.length} chars)`,
        rawPreview: result.text.slice(0, 300),
      },
      requiresHumanReview: true,
    });
    return {
      ok: false,
      error: "Generated body too short — please regenerate",
      code: "CONTENT_TOO_SHORT",
    };
  }

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
};;;;;
