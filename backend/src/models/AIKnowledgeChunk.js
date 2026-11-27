import mongoose from "mongoose";

/*
Retrieval unit — one chunk of an approved knowledge document.
$text index enables keyword retrieval on Atlas M0 (no Vector Search).
Only chunks whose parent document is status:"approved" + approvedForAI:true
may be retrieved (enforced in retrieveKnowledge.js).
*/
const aiKnowledgeChunkSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIKnowledgeDocument",
      required: true,
    },
    // Denormalized for filtering without joins
    documentId: { type: String, required: true }, // e.g. "FM-KB-MS-0001"
    specialty: { type: String, required: true },
    language: { type: String, enum: ["en", "sw"], required: true },
    conditionTags: [{ type: String }],
    chunkIndex: { type: Number, required: true },
    // Heading path for context, e.g. "Chapter 2 > Exercises"
    heading: { type: String, default: null },
    // Page number when source is a PDF
    page: { type: Number, default: null },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

// Keyword retrieval index (MongoDB $text — works on Atlas M0)
aiKnowledgeChunkSchema.index({ content: "text" });
aiKnowledgeChunkSchema.index({ document: 1, chunkIndex: 1 });
aiKnowledgeChunkSchema.index({ specialty: 1, language: 1 });
aiKnowledgeChunkSchema.index({ documentId: 1 });

const AIKnowledgeChunk = mongoose.model("AIKnowledgeChunk", aiKnowledgeChunkSchema);

export default AIKnowledgeChunk;
