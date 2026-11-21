import mongoose from "mongoose";
import { REPORT_REASONS, REPORT_STATUSES, REPORT_ACTIONS } from "../constants/education.js";

const { Schema } = mongoose;

const CopyrightReportSchema = new Schema(
  {
    resource: {
      type: Schema.Types.ObjectId,
      ref: "EducationResource",
      required: true,
    },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reason: { type: String, required: true, enum: REPORT_REASONS },
    explanation: { type: String, required: true, maxlength: 5000 },
    complainantName: { type: String, required: true, maxlength: 200 },
    contactEmail: { type: String, required: true, maxlength: 200 },
    evidenceUrl: { type: String, maxlength: 500 },
    declaration: { type: Boolean, required: true },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: "pending",
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    adminNotes: { type: String, maxlength: 2000 },
    actionTaken: { type: String, enum: REPORT_ACTIONS, default: "none" },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

CopyrightReportSchema.index({ status: 1, createdAt: -1 });
CopyrightReportSchema.index({ resource: 1, createdAt: -1 });

export default mongoose.model("CopyrightReport", CopyrightReportSchema);
