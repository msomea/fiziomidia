import AIKnowledgeDocument from "../../models/AIKnowledgeDocument.js";
import AIKnowledgeChunk from "../../models/AIKnowledgeChunk.js";

/*
Knowledge ingestion — splits source text into retrievable chunks and
stores them under an AIKnowledgeDocument. Documents start in
"discovered" status; they only become retrievable after the governance
workflow (licence → clinical → language review → approved + approvedForAI).

PDF extraction is handled by the caller (scripts/ingestKnowledge.js);
this module works on plain text/markdown.
*/

const CHUNK_SIZE = 1200; // chars
const CHUNK_OVERLAP = 150; // chars

/**
 * Split text into overlapping chunks on paragraph/sentence boundaries.
 * Tracks approximate page numbers when the text contains form feeds (\f)
 * or "Page N" markers from PDF extraction.
 */
export const chunkText = (text) => {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // Split into blocks by blank lines, keeping page markers
  const blocks = normalized.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  const chunks = [];
  let current = "";
  let page = 1;

  const push = () => {
    if (current.trim()) {
      chunks.push({ content: current.trim(), page });
      // overlap: keep tail of current chunk
      current = current.slice(-CHUNK_OVERLAP);
    }
  };

  for (const block of blocks) {
    // Detect page breaks from PDF extraction (form feed or "Page N" header)
    const pageMatch = block.match(/^\f|^Page\s+(\d+)/im);
    if (pageMatch) {
      const m = block.match(/^Page\s+(\d+)/im);
      if (m) page = parseInt(m[1], 10);
      push();
      current = "";
    }

    if ((current + "\n\n" + block).length > CHUNK_SIZE && current) {
      push();
    }
    current = current ? `${current}\n\n${block}` : block;
  }
  push();

  // Hard-split any oversized chunks
  const finalChunks = [];
  for (const c of chunks) {
    if (c.content.length <= CHUNK_SIZE * 1.5) {
      finalChunks.push(c);
    } else {
      for (let i = 0; i < c.content.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
        finalChunks.push({
          content: c.content.slice(i, i + CHUNK_SIZE),
          page: c.page,
        });
      }
    }
  }
  return finalChunks;
};

/**
 * Ingest a document: upsert AIKnowledgeDocument + replace its chunks.
 * @param {Object} params
 * @param {string} params.documentId - e.g. "FM-KB-MS-0001"
 * @param {string} params.title
 * @param {string} params.specialty - enum value
 * @param {string[]} [params.conditionTags]
 * @param {string} params.language - "en"|"sw"
 * @param {string} params.documentType - enum value
 * @param {string[]} [params.targetAudience]
 * @param {Object} params.source - {organization, documentTitle, url, publicationDate, edition, licence}
 * @param {string} params.text - full extracted text
 * @param {string} [params.fileRef] - R2 key / file path
 * @param {string} [params.status] - default "discovered"
 * @returns {Promise<{document, chunkCount}>}
 */
export const ingestDocument = async ({
  documentId,
  title,
  specialty,
  conditionTags = [],
  language,
  documentType,
  targetAudience = [],
  source,
  text,
  fileRef = null,
  status = "discovered",
}) => {
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    throw new Error("No content to ingest — text is empty");
  }

  const doc = await AIKnowledgeDocument.findOneAndUpdate(
    { documentId },
    {
      $set: {
        title,
        specialty,
        conditionTags,
        language,
        documentType,
        targetAudience,
        source,
        fileRef,
        status,
        chunkCount: chunks.length,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // Replace chunks atomically-ish: delete old, insert new
  await AIKnowledgeChunk.deleteMany({ document: doc._id });
  const chunkDocs = chunks.map((c, i) => ({
    document: doc._id,
    documentId,
    specialty,
    language,
    conditionTags,
    chunkIndex: i,
    heading: c.heading || null,
    page: c.page || null,
    content: c.content,
  }));
  await AIKnowledgeChunk.insertMany(chunkDocs);

  return { document: doc, chunkCount: chunks.length };
};
