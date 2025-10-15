import mongoose from "mongoose";
const { Schema } = mongoose;

const ForumSubSchema = new Schema({
  title: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  moderators: [{ type: Schema.Types.ObjectId, ref: "User" }],
  isPublic: { type: Boolean, default: true },
  totalPosts: { type: Number, default: 0 }, // ✅ added
  createdAt: { type: Date, default: Date.now },
});

// 🔹 Cascade delete posts when a sub is removed
ForumSubSchema.pre("remove", async function (next) {
  try {
    const Post = mongoose.model("Post");
    await Post.deleteMany({ sub: this._id }); // delete all posts under this sub
    console.log(`All posts under sub "${this.title}" removed.`);
    next();
  } catch (err) {
    console.error("Error deleting related posts:", err);
    next(err);
  }
});

export default mongoose.model("ForumSub", ForumSubSchema);
