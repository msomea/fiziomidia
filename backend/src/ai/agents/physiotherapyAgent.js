import AIConversation from "../../models/AIConversation.js";
import AIMessage from "../../models/AIMessage.js";
import AIActivityLog from "../../models/AIActivityLog.js";
import { runAgent } from "../core/agentManager.js";
import { scoreLanguage } from "../core/languageDetect.js";
import { getAgentConfig } from "../core/promptManager.js";
import { classifyEmergency, getEscalationMessage } from "../knowledge/safetyRules.js";
import { retrieveKnowledge, formatKnowledgeContext } from "../knowledge/retrieveKnowledge.js";
import { stripPII } from "../knowledge/privacy.js";

/*
Physiotherapy Assistant — Phase 1.
Flow: resolve conversation → persist user msg → emergency classifier
(hard stop, no LLM) → knowledge retrieval ($text over approved chunks)
→ PII strip → Gemini → persist assistant msg with sources.
*/

const MAX_HISTORY_MESSAGES = 10;

/**
 * Handle a chat message end-to-end.
 * @param {Object} params
 * @param {string} params.message - user message
 * @param {Object|null} params.user - authenticated user or null (guest)
 * @param {string} [params.language] - explicit 'en'|'sw'; null → auto-detect
 * @param {string|null} [params.conversationId] - continue existing conversation
 * @param {string|null} [params.guestToken] - scopes guest conversations to one browser
 */
export const handleChat = async ({
  message,
  user,
  language = null,
  conversationId = null,
  guestToken = null,
}) => {
  const agentCfg = await getAgentConfig("physiotherapy");

  // Resolve or create conversation
  const ownerFilter = user?._id ?? null;
  let conversation;
  if (conversationId) {
    conversation = await AIConversation.findOne({
      _id: conversationId,
      user: ownerFilter,
      ...(ownerFilter ? {} : { guestToken }),
    });
    if (!conversation) {
      return {
        ok: false,
        error: "Conversation not found",
        code: "AI_CONVERSATION_NOT_FOUND",
      };
    }
  } else {
    // Language: detect from first message. Default Kiswahili unless the
    // user clearly starts in English. Admins may default to English when
    // the message has no clear language signal.
    const { en, sw } = scoreLanguage(message);
    let detected;
    if (en > sw) detected = "en";
    else if (sw > 0) detected = "sw";
    else detected = user?.role === "admin" ? "en" : "sw";
    const effectiveLanguage = ["en", "sw"].includes(language)
      ? language
      : detected;

    conversation = await AIConversation.create({
      user: ownerFilter,
      guestToken: ownerFilter ? null : guestToken,
      agent: "physiotherapy",
      language: effectiveLanguage,
    });
  }

  // Persist user message (original text — our DB, not sent externally raw)
  await AIMessage.create({
    conversation: conversation._id,
    role: "user",
    content: message,
  });

  /* ---------- 1. Emergency classifier — hard stop before LLM ---------- */
  if (agentCfg.safetyClassifierEnabled) {
    const triage = classifyEmergency(message);
    if (triage.emergency) {
      const escalationText = getEscalationMessage(conversation.language);
      const escalationMsg = await AIMessage.create({
        conversation: conversation._id,
        role: "assistant",
        content: escalationText,
        model: "safety-rules",
      });
      conversation.escalatedAt = new Date();
      conversation.escalationReason = triage.ruleId;
      conversation.status = "flagged";
      await conversation.save();

      await AIActivityLog.create({
        agent: "physiotherapy",
        action: "CHAT_ESCALATION",
        actor: user?._id ?? null,
        conversation: conversation._id,
        details: { ruleId: triage.ruleId, matched: triage.matched },
        requiresHumanReview: true,
      });

      return {
        ok: true,
        conversationId: conversation._id,
        messageId: escalationMsg._id,
        reply: escalationText,
        model: "safety-rules",
        language: conversation.language,
        escalated: true,
      };
    }
  }

  /* ---------- 2. Knowledge retrieval ($text over approved chunks) ---------- */
  let sources = [];
  let knowledgeContext = "";
  if (agentCfg.knowledgeRetrievalEnabled) {
    try {
      sources = await retrieveKnowledge({
        query: message,
        language: conversation.language,
        limit: 5,
      });
      knowledgeContext = formatKnowledgeContext(sources, conversation.language);
    } catch (err) {
      console.warn("Knowledge retrieval failed:", err.message);
    }
  }

  /* ---------- 3. Build prompt (history + knowledge + PII-stripped) ---------- */
  const history = await AIMessage.find({ conversation: conversation._id })
    .sort({ createdAt: -1 })
    .limit(MAX_HISTORY_MESSAGES + 1)
    .lean();
  history.reverse();

  const historyText = history
    .slice(0, -1)
    .map(
      (m) =>
        `${m.role === "user" ? "User" : "Assistant"}: ${stripPII(m.content)}`,
    )
    .join("\n");

  const langInstruction =
    conversation.language === "sw"
      ? "Respond entirely in Kiswahili (Swahili)."
      : "Respond in English.";

  const formatRule =
    "\n\nFormatting rules: plain text only — never use markdown (no **bold**, no # headings, no `code`, no [links](url)). For lists, use simple lines starting with '- '. Keep paragraphs short.";

  const termRule =
    "\n\nMandatory terminology: when responding in Kiswahili, always use 'Fiziotherapia' for physiotherapy, 'Mfiziotherapia' for physiotherapist, and 'Wafiziotherapia' for physiotherapists — never the English words or other spellings.";

  const siteKnowledge = `

You are Fizio AI, the official assistant of FizioMidia (fiziomidia.org), a platform connecting people in Tanzania with physiotherapists.

FizioMidia platform facts (use these for any question about the website, accounts, or procedures):
- Opening an account: anyone can sign up free at the Sign Up page with full name, email, and password. Guests can also chat with you without an account (limited to 10 messages per day).
- Becoming a verified physiotherapist (Mfiziotherapia): log in, go to your profile and choose "Become a Physiotherapist". You must provide: your professional license number, a photo/scanned copy of your license document, your institution, years of experience, and at least one speciality. The admin team reviews and approves licenses — once approved your account becomes a verified physiotherapist profile.
- Official communication: for site-specific questions, account problems, verification issues, or anything not covered here, direct the user to email admin@fiziomidia.com.
- Languages: the platform and you support English and Kiswahili.

Answering rules:
- If the question is about FizioMidia, accounts, verification, or site procedures, answer from the facts above — NO medical disclaimer is needed for these platform questions.
- If the question is medical/physiotherapy-related, the medical disclaimer rules below still apply.`;

  const knowledgeBlock = knowledgeContext
    ? `\n\n${knowledgeContext}\n\nIf the knowledge base above is relevant, ground your answer in it and mention the source title. If it is not relevant, answer from general knowledge and add a brief disclaimer that this is general information, not a medical diagnosis.`
    : "\n\nNo verified knowledge-base entries matched this question. Answer from general knowledge and clearly state this is general educational information, not a medical diagnosis or treatment plan.";

  const rawPrompt = historyText
    ? `Conversation so far:\n${historyText}\n\nUser: ${message}`
    : message;

  // PII strip before anything leaves the platform
  const prompt = stripPII(
    `${rawPrompt}\n\n${langInstruction}${formatRule}${termRule}${siteKnowledge}${knowledgeBlock}`,
  );

  /* ---------- 4. Call model ---------- */
  const result = await runAgent("physiotherapy", prompt, {
    maxOutputTokens: 800,
    temperature: 0.5,
  });

  if (!result.ok) {
    await AIActivityLog.create({
      agent: "physiotherapy",
      action: "CHAT_FAILED",
      actor: user?._id ?? null,
      conversation: conversation._id,
      details: { code: result.code, error: result.error },
      requiresHumanReview: result.code === "AI_QUOTA_EXCEEDED",
    });
    return {
      ok: false,
      error: result.error,
      code: result.code,
      conversationId: conversation._id,
    };
  }

  // Persist assistant reply with retrieval sources.
  // Safety net: strip any residual markdown bold markers the model ignored.
  const cleanReply = result.text.replace(/\*\*(.+?)\*\*/g, "$1");
  const assistantMsg = await AIMessage.create({
    conversation: conversation._id,
    role: "assistant",
    content: cleanReply,
    sources: sources.map((s) => ({
      documentId: s.documentId,
      chunkId: s.chunkId,
      title: s.title,
      url: s.sourceUrl,
    })),
    model: result.model,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
  });

  // Auto-title from first user message
  if (!conversation.title || conversation.title === "New conversation") {
    conversation.title = message.slice(0, 80);
  }
  await conversation.save();

  await AIActivityLog.create({
    agent: "physiotherapy",
    action: "CHAT_MESSAGE",
    actor: user?._id ?? null,
    conversation: conversation._id,
    model: result.model,
    tokensUsed: (result.promptTokens || 0) + (result.completionTokens || 0),
    details: { sourcesUsed: sources.length },
  });

  return {
    ok: true,
    conversationId: conversation._id,
    messageId: assistantMsg._id,
    reply: cleanReply,
    model: result.model,
    language: conversation.language,
    sources: sources.map((s) => ({ title: s.title, url: s.sourceUrl })),
    quota: result.quota,
  };
};;;;;;;;
