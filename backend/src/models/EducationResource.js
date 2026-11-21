import mongoose from "mongoose";
import {
  EDUCATION_CATEGORIES,
  EDUCATION_FILE_TYPES,
  EDUCATION_LANGUAGES,
  EDUCATION_LICENSE_TYPES,
  RESOURCE_STATUSES,
} from "../constants/education.js";

const { Schema } = mongoose;

const EducationResourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },
    category: {
      type: String,
      required: true,
      enum: EDUCATION_CATEGORIES,
    },
    subCategory: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    language: {
      type: String,
      enum: EDUCATION_LANGUAGES,
      default: "en",
    },
    fileName: { type: String, required: true, maxlength: 255 },
    fileType: { type: String, required: true, enum: EDUCATION_FILE_TYPES },
    fileSize: { type: Number, required: true, min: 1 },

    // Storage (Cloudflare R2)
    storageProvider: { type: String, default: "r2" },
    storageBucket: { type: String },
    storageKey: { type: String },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploaderRoleAtUpload: { type: String },

    licenseType: {
      type: String,
      required: true,
      enum: EDUCATION_LICENSE_TYPES,
    },
    licenseUrl: { type: String, trim: true, maxlength: 500 },
    licenseNotes: { type: String, trim: true, maxlength: 2000 },
    copyrightDeclaration: { type: Boolean, required: true },

    status: {
      type: String,
      enum: RESOURCE_STATUSES,
      default: "pending",
      index: true,
    },
    downloadHold: { type: Boolean, default: false },
    downloadCount: { type: Number, default: 0, min: 0 },

    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, maxlength: 1000 },
    removedAt: { type: Date },

    // Moderation history (audit trail)
    moderationHistory: [
      {
        action: { type: String, required: true },
        actor: { type: Schema.Types.ObjectId, ref: "User" },
        reason: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

EducationResourceSchema.index({ status: 1, category: 1, createdAt: -1 });
EducationResourceSchema.index({ uploadedBy: 1, createdAt: -1 });
EducationResourceSchema.index({ title: "text", description: "text" });

export default mongoose.model("EducationResource", EducationResourceSchema);
