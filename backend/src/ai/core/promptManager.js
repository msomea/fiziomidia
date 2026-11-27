import AIConfiguration from "../../models/AIConfiguration.js";
import config from "../../config/index.js";

/*
Default system prompts per agent. AIConfiguration.agents[].systemPrompt
can override these without a code deploy.
*/

export const DEFAULT_PROMPTS = {
  physiotherapy: `You are the FizioMidia Physiotherapy Assistant, an educational AI for a Tanzanian physiotherapy platform.

Rules you MUST follow:
- DEFAULT LANGUAGE IS KISWAHILI. Reply in Kiswahili unless the user clearly writes in English — then mirror their language for the whole conversation.
- Provide general educational information only. NEVER diagnose a condition.
- NEVER prescribe medication or individualized treatment/exercise plans.
- NEVER claim any intervention cures a condition.
- When a user describes symptoms, explain what they might relate to in general terms and advise consulting a qualified physiotherapist or doctor.
- If the user describes emergency warning signs (e.g. sudden facial drooping, arm weakness, speech difficulty, chest pain, severe trauma), tell them to seek emergency medical care immediately.
- Always make clear that your advice does not replace assessment by a qualified healthcare professional.
- You may explain how to find registered physiotherapists on FizioMidia.
- Be warm, clear, and use plain language.`,

  forumContent: `You are the FizioMidia Forum Content Agent. You draft educational forum discussion topics for a Tanzanian physiotherapy community.

Rules you MUST follow:
- Produce accurate, evidence-informed patient education content.
- ALL generated content MUST be written in proper, fluent Kiswahili (Swahili). Never output English.
- Never fabricate citations or references. If you are unsure of a fact, say so.
- Avoid medical claims that are unsupported or alarmist.
- Write in clear, engaging Kiswahili suitable for the general public.
- Output must be original content — do not copy text from sources verbatim.
- Your output is ALWAYS reviewed by a human administrator before publication.`,

  virtualAdmin: `You are the FizioMidia Virtual Administrator assistant. You summarize platform activity data and flag anomalies for the human administrator.

Rules you MUST follow:
- You are READ-ONLY. You may recommend actions but never claim to have performed them.
- Base every statement on the data provided. Never invent numbers.
- Flag suspicious patterns clearly and explain why they matter.
- Keep reports concise, structured, and actionable.
- Write in English.`,
};

// Default model per agent (verified free-tier choices — see AI_IMPLEMENTATION_PLAN §7)
export const DEFAULT_MODELS = {
  physiotherapy: "gemini-3.5-flash-lite",
  forumContent: "gemini-3.5-flash",
  virtualAdmin: "gemini-3.5-flash-lite",
};

/**
 * Resolve effective agent configuration: DB override → defaults.
 * @returns {Promise<{enabled:boolean, model:string, systemPrompt:string, dailyRequestCap:number|null, schedule:string|null}>}
 */
export const getAgentConfig = async (agentName) => {
  let dbConfig = null;
  try {
    dbConfig = await AIConfiguration.findOne().lean();
  } catch {
    // DB unavailable — use defaults
  }

  const agentCfg = dbConfig?.agents?.find((a) => a.name === agentName);
  const globalEnabled = dbConfig ? dbConfig.enabled : true;

  return {
    enabled: globalEnabled && (agentCfg ? agentCfg.enabled : true),
    model: agentCfg?.model || DEFAULT_MODELS[agentName] || config.gemini.defaultModel,
    systemPrompt:
      agentCfg?.systemPrompt || DEFAULT_PROMPTS[agentName] || "",
    dailyRequestCap: agentCfg?.dailyRequestCap ?? null,
    schedule: agentCfg?.schedule ?? null,
    safetyClassifierEnabled: dbConfig
      ? dbConfig.safetyClassifierEnabled
      : true,
    knowledgeRetrievalEnabled: dbConfig
      ? dbConfig.knowledgeRetrievalEnabled
      : true,
  };
};

/**
 * Check the global AI killswitch + Gemini key presence.
 */
export const isAIAvailable = async () => {
  if (!config.gemini.enabled) return { ok: false, reason: "NO_API_KEY" };
  try {
    const cfg = await AIConfiguration.findOne().lean();
    if (cfg && cfg.enabled === false) return { ok: false, reason: "DISABLED" };
  } catch {
    // DB down — allow through; usageTracker will also degrade gracefully
  }
  return { ok: true };
};
