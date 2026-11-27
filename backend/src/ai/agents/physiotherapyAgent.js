import AIConversation from "../../models/AIConversation.js";
import AIMessage from "../../models/AIMessage.js";
import AIActivityLog from "../../models/AIActivityLog.js";
import { runAgent } from "../core/agentManager.js";
import { scoreLanguage } from "../core/languageDetect.js";

/*
Physiotherapy Assistant — Phase 0 implementation.
Phase 1 will add: safetyRules classifier, retrieveKnowledge grounding,
conversation history injection, feedback handling.
*/

const MAX_HISTORY_MESSAGES = 10;

/**
 * Handle a chat message end-to-end.
 * @param {Object} params
 * @param {string} params.message - user message
 * @param {Object|null} params.user - authenticated user or null (guest)
 * @param {string} [params.language] - explicit 'en'|'sw'; null → auto-detect
 * @param {string|null} [params.conversationId] - continue existing conversation
 */
export const handleChat = async ({ message, user, language = null, conversationId = null }) => {
  // Resolve or create conversation
  let conversation;
  if (conversationId) {
    conversation = await AIConversation.findOne({
      _id: conversationId,
      user: user?._id ?? null,
    });
    if (!conversation) {
      return { ok: false, error: "Conversation not found", code: "AI_CONVERSATION_NOT_FOUND" };
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
    // Explicit request language wins only if it matches a clear signal
    const effectiveLanguage = ["en", "sw"].includes(language) ? language : detected;

    conversation = await AIConversation.create({
      user: user?._id ?? null,
      agent: "physiotherapy",
      language: effectiveLanguage,
    });
  }

  // Persist user message
  await AIMessage.create({
    conversation: conversation._id,
    role: "user",
    content: message,
  });

  // Build prompt with recent history (Phase 1 adds knowledge grounding)
  const history = await AIMessage.find({ conversation: conversation._id })
    .sort({ createdAt: -1 })
    .limit(MAX_HISTORY_MESSAGES + 1) // +1 for the message just saved
    .lean();
  history.reverse();

  const historyText = history
    .slice(0, -1) // exclude the just-saved user message (it's the prompt)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  const langInstruction =
    conversation.language === "sw"
      ? "Respond entirely in Kiswahili (Swahili)."
      : "Respond in English.";

  const prompt = historyText
    ? `Conversation so far:\n${historyText}\n\nUser: ${message}\n\n${langInstruction}`
    : `${message}\n\n${langInstruction}`;

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
    return { ok: false, error: result.error, code: result.code, conversationId: conversation._id };
  }

  // Persist assistant reply
  const assistantMsg = await AIMessage.create({
    conversation: conversation._id,
    role: "assistant",
    content: result.text,
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
  });

  return {
    ok: true,
    conversationId: conversation._id,
    messageId: assistantMsg._id,
    reply: result.text,
    model: result.model,
    language: conversation.language,
    quota: result.quota,
  };
};
