import mongoose from "mongoose";

/*
Knowledge document — one record per approved source document.
Schema follows FizioMidia_Physiotherapy_Knowledge_Source_Register.md §6.
Retrieval happens at chunk level via AIKnowledgeChunk ($text index).
*/
const aiKnowledgeDocumentSchema = new mongoose.Schema(
  {
    // Stable identifier, e.g. "FM-KB-MS-0001"
    documentId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    specialty: {
      type: String,
      enum: [
        "musculoskeletal",
        "neurological",
        "cardiorespiratory",
        "pediatric",
        "geriatric",
        "womens-health",
        "exercise-activity",
        "community-rehab",
        "general",
      ],
      required: true,
    },
    conditionTags: [{ type: String }],
    language: { type: String, enum: ["en", "sw"], required: true },
    documentType: {
      type: String,
      enum: [
        "guideline",
        "systematic-review",
        "patient-guide",
        "research",
        "original",
        "leaflet",
        "policy",
      ],
      required: true,
    },
    targetAudience: [
      {
        type: String,
        enum: ["general-public", "patients", "caregivers", "professionals"],
      },
    ],
    // Provenance — required for traceability
    source: {
      organization: { type: String, required: true },
      documentTitle: { type: String, default: null },
      url: { type: String, default: null },
      publicationDate: { type: Date, default: null },
      edition: { type: String, default: null },
      accessedAt: { type: Date, default: null },
      licence: { type: String, default: "To be verified" },
    },
    evidenceType: {
      type: String,
      enum: [
        "guideline",
        "systematic-review",
        "primary-study",
        "patient-resource",
        "general-education",
      ],
      default: "general-education",
    },
    // Governance — per Source Register §7 statuses
    status: {
      type: String,
      enum: [
        "discovered",
        "pending_licence_review",
        "pending_clinical_review",
        "pending_language_review",
        "approved",
        "restricted",
        "rejected",
        "superseded",
        "under_review",
      ],
      default: "discovered",
    },
    // Separate approvals — AI retrieval vs public display
    approvedForAI: { type: Boolean, default: false },
    approvedForPublicDisplay: { type: Boolean, default: false },
    clinicalReviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    languageReviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    nextReviewAt: { type: Date, default: null },
    reviewNotes: { type: String, default: null },
    // File storage reference (R2 key or local path) — content itself lives in chunks
    fileRef: { type: String, default: null },
    chunkCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

aiKnowledgeDocumentSchema.index({ status: 1, approvedForAI: 1 });
aiKnowledgeDocumentSchema.index({ specialty: 1, language: 1 });
aiKnowledgeDocumentSchema.index({ conditionTags: 1 });
aiKnowledgeDocumentSchema.index({ nextReviewAt: 1 });

const AIKnowledgeDocument = mongoose.model(
  "AIKnowledgeDocument",
  aiKnowledgeDocumentSchema,
);

export default AIKnowledgeDocument;
