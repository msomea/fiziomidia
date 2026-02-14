import mongoose from "mongoose";
const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    sub: { type: Schema.Types.ObjectId, ref: "ForumSub", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment"}],
    title: String,
    body: String,
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    score: { type: Number, default: 0 },
    pinned: { type: Boolean, default: false }, 
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", PostSchema);
export default Post;


