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

// Custom validation: at least one of clinic or physiotherapist must be provided
reviewSchema.pre('save', function(next) {
  if (!this.clinic && !this.physiotherapist) {
    const error = new Error('Either clinic or physiotherapist must be provided');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

export default mongoose.model("Review", reviewSchema);
