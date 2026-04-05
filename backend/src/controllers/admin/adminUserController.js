import User from "../../models/User.js";
import { CacheService } from "../../utils/redis.js";
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import escapeRegExp from "../../utils/escapeRegExp.js";
import { sendEmail, EMAIL_FROM } from "../../services/sendEmailService.js";
import { generateFiziomidiaEmail } from "../../templates/emailHelper.js";
import {
  logAdminActivity,
  getUserTargetInfo,
  getLicenseTargetInfo,
  getEmailTargetInfo,
} from "../../middlewares/adminActivityLogger.js";

// -------------------------------------------
// USERS CONTROLLER
// -------------------------------------------

export const listUsers = async (req, res) => {
  try {
    const { search, role, licenseStatus } = req.query;

    const query = {};

    // Search by fullName or email
    if (search) {
      const esc = escapeRegExp(search);
      query.$or = [
        { fullName: { $regex: esc, $options: "i" } },
        { email: { $regex: esc, $options: "i" } },
        { phone: { $regex: esc, $options: "i" } },
      ];
    }

    // Filter by role: e.g., physiotherapist
    if (role) {
      query.role = role;
    }

    // Filter by license verification status in ptProfile.licenses array
    if (licenseStatus) {
      // Match users that have at least one license with given verificationStatus
      query["ptProfile.licenses"] = { $elemMatch: { verificationStatus: licenseStatus } };
    }

    // Limit / pagination could be added later
    const users = await User.find(query)
      .select("-passwordHash -refreshTokens")
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, users });
  } catch (err) {
    console.error("List users error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// GET INDIVIDUAL USER DETAILS
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const user = await User.findById(id).select("-passwordHash -refreshTokens").lean();

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.json({ success: true, user });
  } catch (err) {
    console.error("User details error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch user details" });
  }
};

// UPDATE USER ROLE
export const updateUserRole = [
  logAdminActivity("USER_ROLE_UPDATED", getUserTargetInfo),
  async (req, res) => {
    try {
      const { role } = req.body;
      const userId = req.params.id;

      const validRoles = [
        "member",
        "physiotherapist",
        "pendingPhysiotherapist",
        "admin",
      ];
      if (!validRoles.includes(role)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid role" });
      }

      const user = await User.findById(userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      user.role = role;

      // 🔥 IMPORTANT FIX: If user is changed back to member → wipe PT data
      if (role === "member") {
        user.ptProfile = null;
        user.physioApproval = false;
      }

      await user.save();

      // Invalidate admin dashboard cache due to user role change
      await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
      console.log(
        `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to user role change`,
      );

      return res.json({
        success: true,
        message: "Role updated successfully",
        user,
      });
    } catch (err) {
      console.error("Update role error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update user role" });
    }
  },
];

// VERIFY OR REJECT PT LICENSE
export const updateLicenseStatus = [
  logAdminActivity(
    (req) =>
      req.body.status === "approved" ? "LICENSE_VERIFIED" : "LICENSE_REJECTED",
    getLicenseTargetInfo,
  ),
  asyncHandler(async (req, res) => {
    try {
      const { status, notes, index } = req.body;

      const valid = ["pending", "approved", "rejected"];
      if (!valid.includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid license status" });
      }

      const userId = req.params.id;
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user id" });
      }

      const user = await User.findById(userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });

      if (!user.ptProfile || !user.ptProfile.licenses?.length) {
        return res
          .status(400)
          .json({ success: false, message: "No licenses found for this user" });
      }

      // ✅ Select license by index (fallback to first)
      const licenseDoc =
        typeof index === "number"
          ? user.ptProfile.licenses[index]
          : user.ptProfile.licenses[0];

      if (!licenseDoc) {
        return res
          .status(404)
          .json({ success: false, message: "License not found" });
      }

      // Update license details
      licenseDoc.verificationStatus = status;
      if (typeof notes === "string") {
        licenseDoc.verificationNotes = notes;
      }
      licenseDoc.verified = status === "approved";

      // Update profile verification info
      user.ptProfile.lastLicenseVerificationAt = new Date();

      // Determine if overall profile is verified
      user.ptProfile.isVerified = user.ptProfile.licenses.every(
        (lic) => lic.verificationStatus === "approved",
      );

      // 🔥 Role & access logic
      if (status === "approved") {
        user.physioApproval = true;
        user.role = "physiotherapist";
      } else if (status === "rejected") {
        user.physioApproval = false;
        user.role = "member";
      } else if (status === "pending") {
        user.physioApproval = false;
        user.role = "pendingPhysiotherapist";
      }

      await user.save();

      // Invalidate admin dashboard cache due to PT approval change
      await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
      console.log(
        `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to PT approval change`,
      );

      // Generate email
      const emailHTML = generateFiziomidiaEmail({
        title: "🎉 License Approved!",
        body: `
        <p>Hello ${user.fullName || "there"},</p>
        <p>Great news! Your professional license has been <strong>approved</strong>.</p>
        <p>You now have full access to the Fiziomidia platform features.</p>
        <p>We're excited to have you onboard and look forward to your contribution.</p>
      `,
        buttonText: "Login",
        buttonURL: `https://fiziomidia.org/login`,
      });

      // Send email (non-blocking safe pattern)
      try {
        await sendEmail({
          from: EMAIL_FROM.ADMIN,
          to: user.email,
          subject: "Your License Has Been Approved - FizioMidia",
          html: emailHTML,
        });
      } catch (error) {
        console.error("License approval email failed:", error.message);
      }

      res.json({
        success: true,
        message: `License ${status}`,
        user,
        license: licenseDoc,
      });
    } catch (err) {
      console.error("License update error:", err);
      res
        .status(500)
        .json({ success: false, message: "Failed to update license status" });
    }
  }),
];

// ============================================
// ADMIN SEND EMAIL TO USER
export const sendEmailToUser = [
  logAdminActivity("EMAIL_SENT", getEmailTargetInfo),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, body, buttonText, buttonURL, logoURL } = req.body;

    // Validate required fields
    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: "Email title and body are required",
      });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate branded email HTML
    const emailHTML = generateFiziomidiaEmail({
      title,
      body,
      buttonText,
      buttonURL,
      logoURL: "https://api.fiziomidia.org/api/logo",
    });

    // Send email
    try {
      await sendEmail({
        to: user.email,
        from: EMAIL_FROM.ADMIN,
        subject: title,
        html: emailHTML,
      });

      return res.status(200).json({
        success: true,
        message: "Email sent successfully",
      });
    } catch (err) {
      console.error("Admin send email error:", err.message);

      return res.status(500).json({
        success: false,
        message: "Failed to send email",
      });
    }
  }),
];
