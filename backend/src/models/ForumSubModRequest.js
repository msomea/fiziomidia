import mongoose from "mongoose";

const ForumSubModRequestSchema = new mongoose.Schema(
  {
    sub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ForumSub",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Role assigned to the user for this sub (updated by admin)
    role: {
      type: String,
      enum: ["member", "sub-mod", "mod"],
      default: "member",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    // Optional notes from admin review
    reviewNotes: {
      type: String,
    },
  },
  { timestamps: true }
);

// Prevent duplicate pending requests per user per sub
ForumSubModRequestSchema.index(
  { sub: 1, user: 1 },
  { unique: true }
);

export default mongoose.model(
  "ForumSubModRequest",
  ForumSubModRequestSchema
);
