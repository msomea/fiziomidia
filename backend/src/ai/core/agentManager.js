import { generateContent } from "./aiProvider.js";
import { consumeQuota } from "./usageTracker.js";
import { getAgentConfig, isAIAvailable } from "./promptManager.js";

/*
Central dispatcher — agents never call each other.
Every agent invocation passes through here so quota, config and
availability checks are enforced in one place.
*/

export const AGENTS = ["physiotherapy", "forumContent", "virtualAdmin"];

/**
 * Run an agent task.
 * @param {string} agentName - one of AGENTS
 * @param {string} prompt - task prompt
 * @param {Object} [opts]
 * @param {number} [opts.maxOutputTokens]
 * @param {number} [opts.temperature]
 * @param {boolean} [opts.skipQuota] - internal jobs may bypass per-request quota (still capped daily)
 * @returns {Promise<{ok:boolean, text?:string, model?:string, promptTokens?:number, completionTokens?:number, error?:string, code?:string, quota?:Object}>}
 */
export const runAgent = async (agentName, prompt, opts = {}) => {
  if (!AGENTS.includes(agentName)) {
    return { ok: false, error: `Unknown agent: ${agentName}`, code: "AI_UNKNOWN_AGENT" };
  }

  const availability = await isAIAvailable();
  if (!availability.ok) {
    return { ok: false, error: "AI is not available", code: availability.reason };
  }

  const agentCfg = await getAgentConfig(agentName);
  if (!agentCfg.enabled) {
    return { ok: false, error: `Agent ${agentName} is disabled`, code: "AI_AGENT_DISABLED" };
  }

  const quota = await consumeQuota(agentName);
  if (!quota.allowed) {
    return {
      ok: false,
      error: `Daily quota exceeded for ${agentName} (${quota.used}/${quota.cap})`,
      code: "AI_QUOTA_EXCEEDED",
      quota,
    };
  }

  try {
    const result = await generateContent({
      model: agentCfg.model,
      prompt,
      systemPrompt: agentCfg.systemPrompt || null,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
      temperature: opts.temperature ?? 0.7,
    });
    return { ok: true, ...result, quota };
  } catch (err) {
    return {
      ok: false,
      error: err.message,
      code: err.code || "AI_PROVIDER_ERROR",
      quota,
    };
  }
};
