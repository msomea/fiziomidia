import mongoose from "mongoose";
import { Schema } from "mongoose";

const SponsoredProductSchema = new mongoose.Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    image: { type: String, required: true },
    startAt: { type: Date },
    endAt: { type: Date },
    description: {type: String, default: "" },
    link: { type: String, default: "" }, // link to promo page/product owner
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("SponsoredProduct", SponsoredProductSchema);
