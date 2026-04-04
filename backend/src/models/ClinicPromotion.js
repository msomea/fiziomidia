import mongoose from "mongoose";
const { Schema } = mongoose;

const ClinicPromotionSchema = new Schema(
  {
    clinic: {
      type: Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },

    // Promotion tier
    title: {
      type: String,
      enum: ["Silver", "Gold", "Platinum"],
      required: true,
    },

    price: { type: Number, required: true },
    duration: { type: Number, required: true }, // days

    // Media (optional override from clinic branding)
    imageUrl: { type: String },
    imagePublicId: { type: String },

    // Optional override fields (ONLY if you want ad customization)
    customTitle: { type: String },        // e.g. "Best Neuro Rehab Center"
    customDescription: { type: String },

    startAt: { type: Date, default: Date.now },
    endAt: { type: Date },

    status: {
      type: String,
      enum: ["pending", "active", "suspended", "expired"],
      default: "pending",
    },

    // Ranking system (VERY IMPORTANT)
    priorityScore: { type: Number, default: 0 },

    // Analytics (for future monetization)
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-calculate end date
ClinicPromotionSchema.pre("save", function (next) {
  if (this.duration && !this.endAt) {
    this.endAt = new Date(
      this.startAt.getTime() + this.duration * 24 * 60 * 60 * 1000
    );
  }
  next();
});

export default mongoose.model("ClinicPromotion", ClinicPromotionSchema);