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
    sponsorWebsite: {
      type: String, // image URL
      trim: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
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


// Auto-deactivate expired sponsorships
ForumSubSchema.pre("save", function (next) {
  const now = new Date();
  if (this.endDate && this.endDate < now) {
    this.isSponsored = false;
    this.sponsorName = "";
    this.sponsorLogo = "";
    this.sponsorMessage = "";
    this.sponsorWebsite = "";
    this.startDate = null;
    this.endDate = null;
  }
  next();
});

// Optional: when fetching subs, clean expired ones
ForumSubSchema.statics.cleanExpiredSponsorships = async function () {
  const now = new Date();
  const expiredSubs = await this.find({
    isSponsored: true,
    endDate: { $lt: now },
  });

  for (const sub of expiredSubs) {
    sub.isSponsored = false;
    sub.sponsorName = "";
    sub.sponsorLogo = "";
    sub.sponsorMessage = "";
    sub.sponsorWebsite = "";
    sub.startDate = null;
    sub.endDate = null;
    await sub.save();
  }

  if (expiredSubs.length > 0) {
    console.log(`🕓 Deactivated ${expiredSubs.length} expired sponsorship(s).`);
  }
};


export default mongoose.model("ForumSub", ForumSubSchema);
