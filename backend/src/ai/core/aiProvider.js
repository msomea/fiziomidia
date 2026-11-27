import config from "../../config/index.js";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Call Gemini generateContent.
 * @param {Object} params
 * @param {string} params.model - e.g. "gemini-3.5-flash-lite"
 * @param {string} params.prompt - user prompt text
 * @param {string} [params.systemPrompt] - system instruction
 * @param {number} [params.maxOutputTokens=1024]
 * @param {number} [params.temperature=0.7]
 * @returns {Promise<{text:string, model:string, promptTokens:number|null, completionTokens:number|null}>}
 */
export const generateContent = async ({
  model,
  prompt,
  systemPrompt = null,
  maxOutputTokens = 1024,
  temperature = 0.7,
}) => {
  if (!config.gemini.apiKey) {
    const err = new Error("Gemini API key not configured");
    err.code = "AI_NOT_CONFIGURED";
    throw err;
  }
  if (!model) {
    const err = new Error("Model is required");
    err.code = "AI_MODEL_REQUIRED";
    throw err;
  }

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens,
      temperature,
    },
  };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(
      `${GEMINI_BASE}/${model}:generateContent?key=${config.gemini.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    );
  } catch (err) {
    if (err.name === "AbortError") {
      const e = new Error("Gemini request timed out");
      e.code = "AI_TIMEOUT";
      throw e;
    }
    const e = new Error(`Gemini network error: ${err.message}`);
    e.code = "AI_NETWORK_ERROR";
    throw e;
  } finally {
    clearTimeout(timeout);
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.error?.message || `Gemini API error (HTTP ${res.status})`;
    const err = new Error(msg);
    err.code =
      res.status === 429 ? "AI_RATE_LIMITED" : `AI_HTTP_${res.status}`;
    err.status = res.status;
    throw err;
  }

  const candidate = data?.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  // Some models return thought parts alongside text — take text parts only
  const text = parts
    .filter((p) => typeof p.text === "string" && !p.thought)
    .map((p) => p.text)
    .join("")
    .trim();

  if (!text) {
    const err = new Error("Gemini returned empty response");
    err.code = "AI_EMPTY_RESPONSE";
    throw err;
  }

  const usage = data?.usageMetadata || {};
  return {
    text,
    model,
    promptTokens: usage.promptTokenCount ?? null,
    completionTokens: usage.candidatesTokenCount ?? null,
  };
};

/**
 * Lightweight connectivity check — used by admin "test connection" endpoint.
 */
export const ping = async (model) => {
  const result = await generateContent({
    model,
    prompt: "Reply with exactly: OK",
    maxOutputTokens: 16,
    temperature: 0,
  });
  return result.text;
};
