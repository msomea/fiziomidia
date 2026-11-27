import AIKnowledgeDocument from "../../models/AIKnowledgeDocument.js";
import AIKnowledgeChunk from "../../models/AIKnowledgeChunk.js";

/*
Keyword retrieval over approved knowledge chunks (MongoDB $text).
Only chunks whose parent document is status:"approved" AND
approvedForAI:true are eligible. Specialty/language filters applied
before text search to improve precision.
*/

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

// Common English stopwords stripped before building the $text query
const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "i", "me", "my", "we",
  "you", "your", "it", "this", "that", "what", "how", "why", "when",
  "where", "can", "could", "should", "do", "does", "did", "have", "has",
  "had", "for", "with", "and", "or", "to", "of", "in", "on", "at", "by",
  "from", "about", "please", "tell", "me", "ni", "ya", "na", "kwa",
  "mimi", "nina", "una", "je", "vipi", "nini", "ambapo", "kwamba",
]);

const tokenize = (text) =>
  (text || "")
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));

/**
 * Build a $text-safe query string from user input.
 * $text doesn't support phrases well with punctuation; we OR the terms.
 */
const buildTextQuery = (terms) => {
  // MongoDB $text treats space-separated terms as AND by default;
  // we want OR semantics → join with explicit OR isn't supported in $search,
  // so we keep the most significant terms (max 8) and let scoring rank.
  const unique = [...new Set(terms)].slice(0, 8);
  return unique.join(" ");
};

/**
 * Retrieve relevant knowledge chunks for a query.
 * @param {Object} params
 * @param {string} params.query - user message / search text
 * @param {string} [params.language='sw']
 * @param {string} [params.specialty] - optional specialty boost/filter
 * @param {number} [params.limit]
 * @returns {Promise<Array>} chunks with populated document metadata
 */
export const retrieveKnowledge = async ({
  query,
  language = "sw",
  specialty = null,
  limit = DEFAULT_LIMIT,
}) => {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const cappedLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

  // 1. Approved document IDs eligible for AI retrieval
  const docFilter = { status: "approved", approvedForAI: true };
  if (specialty) docFilter.specialty = specialty;
  const approvedDocs = await AIKnowledgeDocument.find(docFilter)
    .select("_id documentId title specialty language source.url")
    .lean();
  if (approvedDocs.length === 0) return [];

  const docById = new Map(approvedDocs.map((d) => [String(d._id), d]));
  const docIds = approvedDocs.map((d) => d._id);

  // 2. $text search restricted to eligible documents, same language preferred
  const searchQuery = buildTextQuery(terms);
  if (!searchQuery) return [];

  const chunks = await AIKnowledgeChunk.find({
    document: { $in: docIds },
    language,
    $text: { $search: searchQuery },
  })
    .select("document content heading page chunkIndex documentId specialty conditionTags score")
    .sort({ score: { $meta: "textScore" } })
    .limit(cappedLimit * 2) // over-fetch, then specialty-boost + trim
    .lean();

  if (chunks.length === 0) {
    // Fallback: try the other language before giving up
    const otherLang = language === "sw" ? "en" : "sw";
    const fallback = await AIKnowledgeChunk.find({
      document: { $in: docIds },
      language: otherLang,
      $text: { $search: searchQuery },
    })
      .select("document content heading page chunkIndex documentId specialty conditionTags score")
      .sort({ score: { $meta: "textScore" } })
      .limit(cappedLimit)
      .lean();
    return attachSources(fallback, docById).slice(0, cappedLimit);
  }

  return attachSources(chunks, docById, specialty).slice(0, cappedLimit);
};

/**
 * Attach parent document metadata + apply specialty boost ordering.
 */
const attachSources = (chunks, docById, preferredSpecialty = null) => {
  return chunks
    .map((c) => {
      const doc = docById.get(String(c.document));
      return {
        chunkId: c._id,
        content: c.content,
        heading: c.heading,
        page: c.page,
        documentId: c.documentId,
        title: doc?.title || c.documentId,
        sourceUrl: doc?.source?.url || null,
        specialty: c.specialty,
        score: c.score,
      };
    })
    .sort((a, b) => {
      // Specialty match boost, then text score
      const aBoost = preferredSpecialty && a.specialty === preferredSpecialty ? 1 : 0;
      const bBoost = preferredSpecialty && b.specialty === preferredSpecialty ? 1 : 0;
      if (aBoost !== bBoost) return bBoost - aBoost;
      return (b.score || 0) - (a.score || 0);
    });
};

/**
 * Format retrieved chunks as a context block for the LLM prompt.
 */
export const formatKnowledgeContext = (chunks, language = "sw") => {
  if (!chunks || chunks.length === 0) return "";
  const header =
    language === "sw"
      ? "Taarifa zinazohusika kutoka kwa maktaba ya maarifa ya FizioMidia ( tumia tu kama mwongozo wa elimu, si uchunguzi wa matibabu):"
      : "Relevant information from the FizioMidia knowledge base (use only as educational guidance, not a medical diagnosis):";
  const body = chunks
    .map((c, i) => `[Chanzo ${i + 1}: ${c.title}${c.heading ? ` — ${c.heading}` : ""}]\n${c.content}`)
    .join("\n\n---\n\n");
  return `${header}\n\n${body}`;
};
