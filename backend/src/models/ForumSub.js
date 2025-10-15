import mongoose from "mongoose";
const { Schema } = mongoose;

const ForumSubSchema = new Schema(
    {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // 🔹 Sponsorship fields
    isSponsored: {
      type: Boolean,
      default: false,
    },
    sponsorName: {
      type: String,
      trim: true,
    },
    sponsorLogo: {
      type: String, // image URL
      trim: true,
    },
    sponsorMessage: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

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
