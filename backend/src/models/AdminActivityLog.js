import mongoose from "mongoose";

const adminActivityLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "USER_ROLE_UPDATED",
        "LICENSE_VERIFIED",
        "LICENSE_REJECTED",
        "APPOINTMENT_UPDATED",
        "APPOINTMENT_DELETED",
        "PROMOTION_UPDATED",
        "PROMOTION_DELETED",
        "SPONSORSHIP_UPDATED",
        "SUB_DELETED",
        "PRODUCT_CREATED",
        "PRODUCT_UPDATED",
        "PRODUCT_DELETED",
        "EMAIL_SENT",
        "MOD_REQUEST_UPDATED",
        "CLINIC_PROMOTION_APPROVED",
        "CLINIC_PROMOTION_REJECTED",
        "CLINIC_PROMOTION_EXPIRED",
        "CLINIC_PROMOTION_DELETED",
        "CLINIC_PROMOTION_PRIORITY_UPDATED",
        "FORUM_SUB_DELETED",
        "RATE_LIMIT_CLEARED",
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Some actions might not have a specific target
    },
    targetType: {
      type: String,
      required: false,
      enum: [
        "User",
        "Appointment",
        "Promotion",
        "ForumSub",
        "SponsoredProduct",
        "ModRequest",
        "ClinicPromotion",
        "RateLimit",
      ],
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      required: false, // Store additional context like old/new values
    },
    ipAddress: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying
adminActivityLogSchema.index({ admin: 1, createdAt: -1 });
adminActivityLogSchema.index({ action: 1, createdAt: -1 });
adminActivityLogSchema.index({ createdAt: -1 });

const AdminActivityLog = mongoose.model("AdminActivityLog", adminActivityLogSchema);

export default AdminActivityLog;
