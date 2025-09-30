import mongoose from "mongoose";
const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    sub: { type: Schema.Types.ObjectId, ref: "ForumSub", d: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    body: String,
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Post", PostSchema);
