import mongoose from "mongoose";
const { Schema } = mongoose;

const PTRequestSchema = new Schema({
  clinicId: { type: Schema.Types.ObjectId, ref: "Clinic", required: true },
  physiotherapistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Clinic owner
  
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "cancelled"],
    default: "pending"
  },
  
  message: {
    type: String,
    maxlength: 500
  },
  
  responseMessage: {
    type: String,
    maxlength: 500
  },
  
  requestedAt: { type: Date, default: Date.now },
  respondedAt: Date,
});

// Prevent duplicate requests
PTRequestSchema.index({ clinicId: 1, physiotherapistId: 1 }, { unique: true });

// Add indexes for efficient queries
PTRequestSchema.index({ clinicId: 1 });
PTRequestSchema.index({ physiotherapistId: 1 });
PTRequestSchema.index({ status: 1 });
PTRequestSchema.index({ requestedAt: -1 });

// Virtual for checking if request is still pending
PTRequestSchema.virtual("isPending").get(function() {
  return this.status === "pending";
});

// Pre-save middleware to set respondedAt when status changes
PTRequestSchema.pre("save", function(next) {
  if (this.isModified("status") && 
      ["accepted", "rejected", "cancelled"].includes(this.status) && 
      !this.respondedAt) {
    this.respondedAt = new Date();
  }
  next();
});

export default mongoose.model("PTRequest", PTRequestSchema);
