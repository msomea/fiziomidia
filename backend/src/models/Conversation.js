import mongoose from "mongoose";
import Message from "./Message.js";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

/* --------------------------------------------------
   MIDDLEWARE: DELETE ALL MESSAGES WHEN CONVERSATION IS REMOVED
-------------------------------------------------- */

// For findOneAndDelete(), findByIdAndDelete(), etc.
conversationSchema.pre("findOneAndDelete", async function (next) {
  const conversation = await this.model.findOne(this.getQuery());

  if (!conversation) return next();

  await Message.deleteMany({ _id: { $in: conversation.messages } });

  next();
});

// Optional: If you also want cascading on deleteOne()
conversationSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  await Message.deleteMany({ _id: { $in: this.messages } });
  next();
});

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
