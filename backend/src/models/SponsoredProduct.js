import mongoose from "mongoose";

const SponsoredProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: String, required: true },
    image: { type: String, required: true },
    link: { type: String, default: "" }, // link to promo page/product owner
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("SponsoredProduct", SponsoredProductSchema);
