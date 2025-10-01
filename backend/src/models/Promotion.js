import mongoose from "mongoose";
const { Schema } = mongoose;

const PromotionSchema = new Schema(
  {
    pt: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startAt: { type: Date },
    endAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "active", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Promotion", PromotionSchema);