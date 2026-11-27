/*
Lightweight EN/SW language detection for chat.
Heuristic scoring on function words — no API call, $0.
Default is 'sw' (Swahili) unless English signals are clearly stronger.
*/

const EN_WORDS = new Set([
  "the", "is", "are", "was", "were", "my", "your", "i", "me", "we",
  "what", "how", "why", "when", "where", "can", "could", "should",
  "pain", "back", "knee", "shoulder", "exercise", "help", "have",
  "has", "do", "does", "for", "with", "and", "or", "to", "of", "in",
  "on", "at", "it", "this", "that", "there", "please", "thank",
  "doctor", "physio", "therapy", "treatment", "injury", "hurt",
]);

const SW_WORDS = new Set([
  "ni", "ya", "na", "kwa", "mimi", "wewe", "yeye", "sisi", "ninyi",
  "maumivu", "maumivu", "nina", "una", "ana", "tuna", "wana",
  "vipi", "je", "tafadhali", "asante", "daktari", "matibabu",
  "mazoezi", "matumizi", "kwenda", "kutoka", "katika", "juu", "chini",
  "sawa", "vizuri", "hapana", "ndiyo", "kwa nini", "namna", "ambayo",
  "ambapo", "lakini", "au", "pia", "tu", "kwamba", "ili", "baada",
  "kabla", "siku", "wiki", "mwezi", "mwili", "mguu", "mkono", "mgongo",
]);

const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-zà-ÿ\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

/**
 * @param {string} text
 * @returns {{en:number, sw:number}}
 */
export const scoreLanguage = (text) => {
  const scores = { en: 0, sw: 0 };
  if (!text || typeof text !== "string") return scores;
  for (const t of tokenize(text)) {
    if (EN_WORDS.has(t)) scores.en++;
    if (SW_WORDS.has(t)) scores.sw++;
  }
  return scores;
};

/**
 * @param {string} text
 * @returns {"en"|"sw"}
 */
export const detectLanguage = (text) => {
  const { en, sw } = scoreLanguage(text);
  // English only wins on a clear signal; ties/ambiguity → Swahili default
  return en > sw ? "en" : "sw";
};
