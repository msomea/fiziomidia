import mongoose from "mongoose";
const { Schema } = mongoose;

const PromotionSchema = new Schema({
  pt: { type: Schema.Types.ObjectId, ref: "User" },
  startAt: Date,
  endAt: Date,
  stripePaymentId: String,
  active: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Promotion", PromotionSchema);
