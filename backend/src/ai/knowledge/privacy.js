/*
PII minimization — strip direct identifiers before text is sent to
third-party APIs (Gemini). Original messages stay in our DB; only the
sanitized version leaves the platform. Log only metadata in AIActivityLog.
*/

const PATTERNS = [
  // Emails
  [/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email]"],
  // Phone numbers (Tanzanian + international-ish)
  [/\+?\d[\d\s\-()]{7,}\d/g, "[phone]"],
  // National ID / passport-ish long digit sequences
  [/\b\d{10,}\b/g, "[id]"],
  // URLs (may contain identifying paths)
  [/https?:\/\/\S+/g, "[link]"],
];

/**
 * Remove direct identifiers from text before external API calls.
 * Conservative: only strips clear PII patterns, keeps medical content.
 */
export const stripPII = (text) => {
  if (!text || typeof text !== "string") return text;
  let out = text;
  for (const [pattern, replacement] of PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
};
