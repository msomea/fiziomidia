import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  region: { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  ward: { type: String, required: true, index: true },
  street: { type: String, required: true, index: true },
  postcode: { type: String },
  place: { type: String }
});

locationSchema.index({ region: 1, district: 1, ward: 1, street: 1 });

export default mongoose.model("Location", locationSchema);
