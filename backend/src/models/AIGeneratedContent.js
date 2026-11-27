import mongoose from "mongoose";

const aiGeneratedContentSchema = new mongoose.Schema(
  {
    agent: {
      type: String,
      enum: ["forumContent", "virtualAdmin"],
      required: true,
    },
    // Forum target (forumContent agent)
    forumSub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumSub",
      default: null,
    },
    // Content payload
    title: { type: String, required: true },
    body: { type: String, required: true },
    language: { type: String, enum: ["en", "sw"], default: "sw" },
    // Sources the agent claims to have used (must be verified by admin)
    references: [
      {
        title: String,
        url: String,
      },
    ],
    // Workflow status — agent NEVER publishes directly
    status: {
      type: String,
      enum: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "regeneration_requested",
        "published",
      ],
      default: "draft",
    },
    // Human review trail
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    reviewNotes: { type: String, default: null },
    // Published forum post link
    publishedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    // Model usage
    model: { type: String, default: null },
    promptTokens: { type: Number, default: null },
    completionTokens: { type: Number, default: null },
    // Scheduled-run metadata
    scheduledFor: { type: Date, default: null },
  },
  { timestamps: true },
);

aiGeneratedContentSchema.index({ status: 1, createdAt: -1 });
aiGeneratedContentSchema.index({ forumSub: 1, status: 1 });
aiGeneratedContentSchema.index({ agent: 1, createdAt: -1 });

const AIGeneratedContent = mongoose.model(
  "AIGeneratedContent",
  aiGeneratedContentSchema,
);

export default AIGeneratedContent;
