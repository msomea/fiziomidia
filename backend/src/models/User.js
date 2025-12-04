import mongoose from "mongoose";
const { Schema } = mongoose;

// Working Hours Schema
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

// PT License Schema
const LicenseSchema = new Schema({
  licenseNumber: { type: String, required: true },
  licenseFileUrl: String,
  licenseFileType: String,  
  verificationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  verificationNotes: String,
  verified: { type: Boolean, default: false },
  submittedAt: { type: Date, default: Date.now },
});

// PT Profile Schema
const PtProfileSchema = new Schema(
  {
    title: String,
    institution: String,

    isPrivatePractice: { type: Boolean, default: true },
    clinicIds: [{ type: Schema.Types.ObjectId, ref: "Clinic" }],

    licenses: [LicenseSchema],

    speciality: [String],
    yearsOfExperience: Number,

    workingHours: [WorkingHoursSchema],

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
        current: { type: Boolean, default: false },
        description: String,
      },
    ],

    services: [
      {
        name: String,
        description: String,
        duration: Number,
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

    documents: [
      {
        name: String,
        url: String,
        verified: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    changeLogs: [
      {
        field: String,
        oldValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  { _id: false }
);


// Virtuals
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
  const days = Math.floor((now - this.licenseSubmittedAt) / (1000 * 60 * 60 * 24));
  return days;
});

// User Schema
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String },
  role: {
    type: String,
    enum: ["guest", "member", "physiotherapist", "admin"],
    default: "member",
  },
  fullName: { type: String },
  savedPTs: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  phone: String,
  profileImageUrl: String,
  ptProfile: PtProfileSchema,
  bio: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  isLoggedIn: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  refreshTokens: [
    {
      token: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  appointments: [{ type: Schema.Types.ObjectId, ref: "Appointment" }],
  notifications: [
    {
      type: { type: String },
      message: String,
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  location: {
    type: {
      type: String,      
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    region: { type: String },
    district: { type: String },
    ward: { type: String },
    street: { type: String }
  },

});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ "ptProfile.speciality": 1 });
UserSchema.index({ "ptProfile.licenseVerificationStatus": 1 });
UserSchema.index({ "ptProfile.licenseNumber": 1 });
UserSchema.index({ createdAt: -1 });

// Indexes for location search
UserSchema.index({ "ptProfile.location.region": 1 });
UserSchema.index({ "ptProfile.location.district": 1 });
UserSchema.index({ "ptProfile.location.ward": 1 });
UserSchema.index({ "ptProfile.location.street": 1 });

// Middleware for license verification, ratings, working hours
UserSchema.pre("save", function (next) {
  try {
    // If ptProfile is null, skip all ptProfile-specific checks
    const hasPT = !!this.ptProfile;
    // LICENSE VALIDATION
    if (
      hasPT &&
      (this.isModified("ptProfile.licenseNumber") ||
        this.isModified("ptProfile.licenseImageUrl"))
    ) {
      this.ptProfile.licenseVerified = false;
      this.ptProfile.licenseVerificationStatus = "pending";
      this.ptProfile.licenseSubmittedAt = new Date();

      const licenseNumberRegex = /^MCT([A-Z]{2,3})?\d{4}$/;
      if (
        this.ptProfile.licenseNumber &&
        !licenseNumberRegex.test(this.ptProfile.licenseNumber)
      ) {
        return next(
          new Error("Invalid license number format. Must be MCT0123")
        );
      }
    }
    // RATINGS VALIDATION
    if (hasPT && this.isModified("ptProfile.ratings")) {
      const ratings = this.ptProfile.ratings;
      if (ratings) {
        if (
          typeof ratings.average === "number" &&
          (ratings.average < 0 || ratings.average > 5)
        ) {
          return next(new Error("Rating must be between 0 and 5"));
        }

        if (
          typeof ratings.count === "number" &&
          ratings.count < 0
        ) {
          return next(
            new Error("Ratings count cannot be negative")
          );
        }
      }
    }
    // WORKING HOURS VALIDATION
    if (hasPT && this.isModified("ptProfile.workingHours")) {
      const whList = this.ptProfile.workingHours || [];

      for (const wh of whList) {
        if (wh.from && wh.to && wh.from >= wh.to) {
          return next(
            new Error(
              `Invalid working hours for ${wh.dayOfWeek}: 'from' must be before 'to'`
            )
          );
        }
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

// Instance method: calculate next available slot
UserSchema.methods.getNextAvailableSlot = function () {
  if (!this.ptProfile || !this.ptProfile.workingHours || !this.ptProfile.availability.isAcceptingNewPatients) {
    return null;
  }

  const workingHours = this.ptProfile.workingHours;
  const today = new Date();
  let currentDate = this.ptProfile.availability.nextAvailableDate || today;

  for (let i = 0; i < 30; i++) {
    const dayOfWeek = currentDate.toLocaleDateString("en-US", { weekday: "long" });
    const wh = workingHours.find(w => w.dayOfWeek === dayOfWeek && w.isAvailable);

    if (wh) {
      const fromParts = wh.from.split(":").map(Number);
      const nextSlot = new Date(currentDate);
      nextSlot.setHours(fromParts[0], fromParts[1], 0, 0);

      if (nextSlot < today) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      return nextSlot;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return null;
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
