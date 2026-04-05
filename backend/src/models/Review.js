import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    physiotherapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Review", reviewSchema);
