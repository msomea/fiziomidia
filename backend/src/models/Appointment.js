import mongoose from "mongoose";
const { Schema } = mongoose;

const AppointmentSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pt: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clinic: { type: Schema.Types.ObjectId, ref: "Clinic" },
    requestedAt: { type: Date, default: Date.now },
    scheduledAt: Date,
    durationMinutes: { type: Number, default: 60 },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled", "completed"],
      default: "pending",
    },
    notes: String,
    adminNotes: String,
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", AppointmentSchema);
