import mongoose from "mongoose";
const { Schema } = mongoose;

const AppointmentSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pt: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clinic: { type: Schema.Types.ObjectId, ref: "Clinic" },
    requestedAt: { type: Date, default: Date.now },
    scheduledAt: { type: Date, required: true },
    // Keep legacy fields for backward compatibility during migration
    scheduledDate: { type: String },
    scheduledTime: { type: String },
    durationMinutes: { type: Number, default: 60 },
    timezone: { type: String, default: "Africa/Dar_es_Salaam" },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled", "completed"],
      default: "pending",
    },
    notes: String,
    adminNotes: String,
  },
  { timestamps: true },
);

// Method to get scheduled time in East Africa Time
AppointmentSchema.methods.getScheduledAtEAT = function() {
  return new Date(this.scheduledAt.toLocaleString("en-US", {timeZone: "Africa/Dar_es_Salaam"}));
};

// Pre-save middleware to populate legacy fields
AppointmentSchema.pre('save', function(next) {
  if (this.scheduledAt && !this.scheduledDate && !this.scheduledTime) {
    this.scheduledDate = this.scheduledAt.toISOString().split('T')[0];
    this.scheduledTime = this.scheduledAt.toTimeString().slice(0, 5);
  }
  next();
});

export default mongoose.model("Appointment", AppointmentSchema);
