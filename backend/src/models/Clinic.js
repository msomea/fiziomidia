import mongoose from "mongoose";
const { Schema } = mongoose;

const ClinicSchema = new Schema({
  name: String,
  address: String,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: [Number], // [lon, lat]
  },
  contactPhone: String,
  ownerUserId: { type: Schema.Types.ObjectId, ref: "User" },
  physiotherapists: [{ type: Schema.Types.ObjectId, ref: "User" }],
  services: [String],

  rating: {
    average: Number,
    count: Number
  },
});

ClinicSchema.index({ location: "2dsphere" });

export default mongoose.model("Clinic", ClinicSchema);
