import mongoose from "mongoose";
import {
  EDUCATION_CATEGORIES,
  EDUCATION_FILE_TYPES,
  EDUCATION_LANGUAGES,
  REQUEST_STATUSES,
} from "../constants/education.js";

const { Schema } = mongoose;

const ResourceRequestSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    category: {
      type: String,
      required: true,
      enum: EDUCATION_CATEGORIES,
    },
    preferredFormat: { type: String, enum: EDUCATION_FILE_TYPES },
    language: { type: String, enum: EDUCATION_LANGUAGES },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      default: "open",
      index: true,
    },
    fulfilledResource: {
      type: Schema.Types.ObjectId,
      ref: "EducationResource",
    },
    adminNotes: { type: String, maxlength: 2000 },
  },
  { timestamps: true }
);

ResourceRequestSchema.index({ status: 1, createdAt: -1 });
ResourceRequestSchema.index({ requestedBy: 1, createdAt: -1 });

export default mongoose.model("ResourceRequest", ResourceRequestSchema);
