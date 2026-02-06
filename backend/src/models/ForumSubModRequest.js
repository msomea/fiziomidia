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
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// prevent duplicate pending requests
ForumSubModRequestSchema.index(
  { sub: 1, user: 1 },
  { unique: true }
);

export default mongoose.model("ForumSubModRequest", ForumSubModRequestSchema);
