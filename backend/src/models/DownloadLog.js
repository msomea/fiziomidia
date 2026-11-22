import mongoose from "mongoose";

const { Schema } = mongoose;

// Tracks authorized education resource downloads per user per UTC day.
// Used to enforce the daily download quota.
const DownloadLogSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resource: { type: Schema.Types.ObjectId, ref: "EducationResource", required: true },
    // UTC day key, e.g. "2026-11-22" — makes daily counting a simple equality match.
    date: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

DownloadLogSchema.index({ user: 1, date: 1 });
// Auto-purge logs older than 40 days (quota only needs today).
DownloadLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 40 });

export default mongoose.model("DownloadLog", DownloadLogSchema);
