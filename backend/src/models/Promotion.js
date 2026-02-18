import mongoose from "mongoose";
const { Schema } = mongoose;

const PromotionSchema = new Schema(
  {
    pt: { type: Schema.Types.ObjectId, ref: "User", required: true },

    title: {
      type: String,
      enum: ["Silver", "Gold", "Platinum"],
      required: true,
    },

    price: { type: Number, required: true },

    duration: { type: Number, required: true }, // duration in days

    imageUrl: { type: String }, 
    imagePublicId: { type: String},

    startAt: { type: Date, default: Date.now },
    endAt: { type: Date },

    description: { type: String },

    status: {
      type: String,
      enum: ["pending", "active", "suspended", "expired"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Pre-save middleware to calculate endAt based on duration
PromotionSchema.pre("save", function (next) {
  if (this.duration && !this.endAt) {
    this.endAt = new Date(this.startAt.getTime() + this.duration * 24 * 60 * 60 * 1000);
  }
  next();
});

export default mongoose.model("Promotion", PromotionSchema);
