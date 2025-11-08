import mongoose from "mongoose";
const { Schema } = mongoose;

const WorkingHoursSchema = new Schema(
  {
    dayOfWeek: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    from: {
      type: String,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format (HH:MM)!`,
      },
    },
    to: {
      type: String,
      validate: {
        validator: function (v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format (HH:MM)!`,
      },
    },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const PtProfileSchema = new Schema(
  {
    title: String, // Professional title
    institution: String,
    isPrivatePractice: { type: Boolean, default: true },
    clinicIds: [{ type: Schema.Types.ObjectId, ref: "Clinic" }],
    licenseImageUrl: String,
    licenseNumber: String,
    licenseVerified: { type: Boolean, default: false },
    licenseVerificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    licenseVerificationNotes: String, // Admin feedback on verification
    licenseSubmittedAt: Date,
    bio: String,
    speciality: [String],
    yearsOfExperience: { type: String },
    workingHours: [WorkingHoursSchema],
    promotionActiveUntil: Date,
    education: [
      {
        institution: String,
        degree: String,
        field: String,
        startYear: String,
        endYear: String,
        certificateUrl: String,
      },
    ],
    workExperience: [
      {
        institution: String,
        position: String,
        startDate: Date,
        endDate: Date,
        current: Boolean,
        description: String,
      },
    ],
    services: [
      {
        name: String,
        description: String,
        duration: Number, // in minutes
        price: Number,
      },
    ],
    languages: [
      {
        language: String,
        proficiency: {
          type: String,
          enum: ["Basic", "Intermediate", "Fluent", "Native"],
        },
      },
    ],
    gallery: [
      {
        imageUrl: String,
        caption: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    availability: {
      isAcceptingNewPatients: { type: Boolean, default: true },
      nextAvailableDate: Date,
    },
    professionalMemberships: [
      {
        organization: String,
        membershipNumber: String,
        validUntil: Date,
      },
    ],
  },
  { _id: false }
);

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String },
  role: {
    type: String,
    enum: ["member", "physiotherapist", "admin"],
    default: "member",
  },
  fullName: { type: String },
  phone: String,
  profileImageUrl: String,
  ptProfile: PtProfileSchema,
  location: { type: String },
  bio: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  isLoggedIn: { type: Boolean, default: false },

  // 🔹 Refresh token storage
  refreshTokens: [
    {
      token: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ "ptProfile.speciality": 1 });
UserSchema.index({ "ptProfile.licenseVerificationStatus": 1 });
UserSchema.index({ "ptProfile.licenseNumber": 1 });
UserSchema.index({ createdAt: -1 });

// Virtuals on PtProfileSchema
PtProfileSchema.virtual("verificationStatus").get(function () {
  if (!this.licenseNumber || !this.licenseImageUrl) return "incomplete";
  return this.licenseVerificationStatus;
});

PtProfileSchema.virtual("isFullyVerified").get(function () {
  return this.licenseVerified && this.licenseVerificationStatus === "approved";
});

PtProfileSchema.virtual("daysInPractice").get(function () {
  if (!this.licenseSubmittedAt) return null;
  const now = new Date();
  const days = Math.floor(
    (now - this.licenseSubmittedAt) / (1000 * 60 * 60 * 24)
  );
  return days;
});

// Middleware for license verification: reset status and validate format when license fields change
UserSchema.pre("save", function (next) {
  try {
    if (
      this.isModified &&
      (this.isModified("ptProfile.licenseNumber") ||
        this.isModified("ptProfile.licenseImageUrl"))
    ) {
      if (this.ptProfile) {
        this.ptProfile.licenseVerified = false;
        this.ptProfile.licenseVerificationStatus = "pending";
        this.ptProfile.licenseSubmittedAt = new Date();

        // Example format validation: XXX-12345 (adjust to your local format)
        const licenseNumberRegex = /^[A-Z]{3}-\d{5}$/;
        if (
          this.ptProfile.licenseNumber &&
          !licenseNumberRegex.test(this.ptProfile.licenseNumber)
        ) {
          return next(
            new Error("Invalid license number format. Must be XXX-12345")
          );
        }
      }
    }

    // Rating validation
    if (this.isModified && this.isModified("ptProfile.ratings")) {
      const ratings = this.ptProfile.ratings;
      if (ratings && (ratings.average < 0 || ratings.average > 5)) {
        return next(new Error("Rating must be between 0 and 5"));
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
});

// Instance method: needs license review
UserSchema.methods.needsLicenseReview = function () {
  if (!this.ptProfile) return false;
  return (
    this.ptProfile.licenseVerificationStatus === "pending" &&
    !!this.ptProfile.licenseNumber &&
    !!this.ptProfile.licenseImageUrl
  );
};

// Static: find PTs pending verification
UserSchema.statics.findPendingVerifications = function () {
  return this.find({
    role: "physiotherapist",
    "ptProfile.licenseVerificationStatus": "pending",
    "ptProfile.licenseNumber": { $exists: true },
    "ptProfile.licenseImageUrl": { $exists: true },
  }).select(
    "fullName email ptProfile.licenseNumber ptProfile.licenseImageUrl ptProfile.licenseSubmittedAt"
  );
};

export default mongoose.model("User", UserSchema);
