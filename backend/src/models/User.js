import mongoose from "mongoose";
const { Schema } = mongoose;

const WorkingHoursSchema = new Schema(
  {
    dayOfWeek: Number, // 0-6
    from: String, // "09:00"
    to: String,
  },
  { _id: false }
);

const PtProfileSchema = new Schema(
  {
    institution: String,
    isPrivatePractice: { type: Boolean, default: true },
    clinicIds: [{ type: Schema.Types.ObjectId, ref: "Clinic" }],
    licenseImageUrl: String,
    licenseNumber: String,
    licenseVerified: { type: Boolean, default: false },
    bio: String,
    specialties: [String],
    yearsOfExperience: Number,
    workingHours: [WorkingHoursSchema],
    promotionActiveUntil: Date,
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
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
});

export default mongoose.model("User", UserSchema);
