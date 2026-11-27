import mongoose from "mongoose";

const aiActivityLogSchema = new mongoose.Schema(
  {
    agent: {
      type: String,
      enum: ["physiotherapy", "forumContent", "virtualAdmin", "system"],
      required: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. CHAT_MESSAGE, CHAT_ESCALATION, CONTENT_GENERATED,
      // CONTENT_APPROVED, CONTENT_REJECTED, REPORT_GENERATED,
      // ANOMALY_FLAGGED, CONFIG_UPDATED, QUOTA_EXCEEDED
    },
    // Who/what triggered it (user for chat, null for jobs)
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Related entities
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIConversation",
      default: null,
    },
    generatedContent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIGeneratedContent",
      default: null,
    },
    // Free-form context — NEVER store raw patient PII here
    details: { type: mongoose.Schema.Types.Mixed, default: null },
    // Model + token usage
    model: { type: String, default: null },
    tokensUsed: { type: Number, default: null },
    // Flags needing human attention
    requiresHumanReview: { type: Boolean, default: false },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

aiActivityLogSchema.index({ agent: 1, createdAt: -1 });
aiActivityLogSchema.index({ action: 1, createdAt: -1 });
aiActivityLogSchema.index({ requiresHumanReview: 1, createdAt: -1 });
aiActivityLogSchema.index({ createdAt: -1 });

const AIActivityLog = mongoose.model("AIActivityLog", aiActivityLogSchema);

export default AIActivityLog;
