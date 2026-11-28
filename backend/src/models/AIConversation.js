import mongoose from "mongoose";

const aiConversationSchema = new mongoose.Schema(
  {
    // null userId = guest conversation; guestToken scopes it to one browser
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestToken: { type: String, default: null, index: true },
    agent: {
      type: String,
      enum: ["physiotherapy", "forumContent", "virtualAdmin"],
      default: "physiotherapy",
    },
    language: {
      type: String,
      enum: ["en", "sw"],
      default: "en",
    },
    title: { type: String, default: "New conversation" },
    status: {
      type: String,
      enum: ["active", "closed", "flagged"],
      default: "active",
    },
    // Set when safety classifier detects emergency signs
    escalatedAt: { type: Date, default: null },
    escalationReason: { type: String, default: null },
  },
  { timestamps: true },
);

aiConversationSchema.index({ user: 1, updatedAt: -1 });
aiConversationSchema.index({ status: 1, createdAt: -1 });

const AIConversation = mongoose.model("AIConversation", aiConversationSchema);

export default AIConversation;
