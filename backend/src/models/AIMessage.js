import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIConversation",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, required: true },
    // Retrieval references used to ground this assistant reply
    sources: [
      {
        documentId: String,
        chunkId: mongoose.Schema.Types.ObjectId,
        title: String,
        url: String,
      },
    ],
    // Model + token usage for this turn
    model: { type: String, default: null },
    promptTokens: { type: Number, default: null },
    completionTokens: { type: Number, default: null },
    // User feedback on assistant messages
    feedback: {
      type: String,
      enum: ["helpful", "not_helpful", null],
      default: null,
    },
  },
  { timestamps: true },
);

aiMessageSchema.index({ conversation: 1, createdAt: 1 });

const AIMessage = mongoose.model("AIMessage", aiMessageSchema);

export default AIMessage;
