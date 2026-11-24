import mongoose from "mongoose";

const { Schema } = mongoose;

const TeamMemberSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    image: {
      type: String,
      required: true,
    },
    imagePublicId: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

TeamMemberSchema.index({ isActive: 1, sortOrder: 1, createdAt: 1 });

export default mongoose.model("TeamMember", TeamMemberSchema);
