import mongoose from "mongoose";
const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    sub: { type: Schema.Types.ObjectId, ref: "ForumSub", required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    body: String,
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    downvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// 🔹 When a post is created — increment totalPosts on the related sub
PostSchema.post("save", async function (doc) {
  try {
    await mongoose.model("ForumSub").findByIdAndUpdate(doc.sub, {
      $inc: { totalPosts: 1 },
    });
  } catch (err) {
    console.error("Error incrementing totalPosts:", err);
  }
});

// 🔹 When a post is removed — decrement totalPosts on the related sub
PostSchema.post("remove", async function (doc) {
  try {
    await mongoose.model("ForumSub").findByIdAndUpdate(doc.sub, {
      $inc: { totalPosts: -1 },
    });
  } catch (err) {
    console.error("Error decrementing totalPosts:", err);
  }
});

export default mongoose.model("Post", PostSchema);
