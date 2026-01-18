import mongoose from "mongoose";

const SponsoredProductSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["equipment", "digital", "services", "others"],
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    duration: {
      type: Number, // Days
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: false,
    },

    link: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      required: true, // stored image URL
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-set end date when status becomes approved
SponsoredProductSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "approved") {
      this.isActive = true;
      this.startDate = new Date();
      this.endDate = new Date(
        Date.now() + this.duration * 24 * 60 * 60 * 1000
      );
    }

    if (this.status === "rejected") {
      this.isActive = false;
      this.startDate = null;
      this.endDate = null;
    }
  }

  next();
});

export default mongoose.model("SponsoredProduct", SponsoredProductSchema);
