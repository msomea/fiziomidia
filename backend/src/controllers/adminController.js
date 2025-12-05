import ForumSub from "../models/ForumSub.js";
import User from "../models/User.js";
import Clinic from "../models/Clinic.js";
import Appointment from "../models/Appointment.js";
import Promotion from "../models/Promotion.js";
import mongoose from "mongoose";
import Post from "../models/Post.js";

// -------------------------------------------
// USERS CONTROLER
// -------------------------------------------
export const listUsers = async (req, res) => {
  try {
    const { search, role, licenseStatus } = req.query;

    const query = {};

    // Search by fullName or email
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
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
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ["guest", "member", "physiotherapist", "admin"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role provided" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select("-passwordHash -refreshTokens");

    if (!updatedUser) return res.status(404).json({ success: false, message: "User not found" });

    return res.json({ success: true, message: "Role updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Role update error:", err);
    return res.status(500).json({ success: false, message: "Failed to update user role" });
  }
};

// VERIFY OR REJECT PT LICENSE
export const updateLicenseStatus = async (req, res) => {
  try {
    const { status, notes, licenseId } = req.body;
    // expected status values: "pending" | "approved" | "rejected"
    const valid = ["pending", "approved", "rejected"];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid license status" });
    }

    const userId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // ensure ptProfile and licenses exist
    if (!user.ptProfile || !Array.isArray(user.ptProfile.licenses) || user.ptProfile.licenses.length === 0) {
      return res.status(400).json({ success: false, message: "No licenses found for this user" });
    }

    // find license by id if provided, otherwise default to first license
    let licenseDoc;
    if (licenseId) {
      licenseDoc = user.ptProfile.licenses.id(licenseId);
      if (!licenseDoc) {
        return res.status(404).json({ success: false, message: "License not found" });
      }
    } else {
      licenseDoc = user.ptProfile.licenses[0];
    }

    // update fields
    licenseDoc.verificationStatus = status;
    licenseDoc.verificationNotes = typeof notes === "string" ? notes : licenseDoc.verificationNotes;
    licenseDoc.verified = status === "approved";

    // Optional: update top-level indicators on ptProfile for convenience/search
    user.ptProfile.lastLicenseVerificationAt = new Date();
    user.ptProfile.isVerified = status === "approved";

    await user.save();

    return res.json({
      success: true,
      message: `License ${status}`,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        ptProfile: {
          licenses: user.ptProfile.licenses,
          isVerified: user.ptProfile.isVerified,
          lastLicenseVerificationAt: user.ptProfile.lastLicenseVerificationAt,
        },
      },
      license: licenseDoc,
    });
  } catch (err) {
    console.error("License update error:", err);
    return res.status(500).json({ success: false, message: "Failed to update license status" });
  }
};

// ============================================
// APPOINTMENTS CONTROLLER
// ============================================
export const getAllAppointments = async (req, res) => {
  try {
    const { search = "", clinic = "", pt = "", requester = "", status = "" } = req.query;

    // Build dynamic query
    let query = {};

    // global search
    if (search) {
      query.$or = [
        { notes: new RegExp(search, "i") },
        { adminNotes: new RegExp(search, "i") }
      ];
    }

    // Filter by clinic NAME
    if (clinic) {
      const clinicMatches = await Clinic.find({
        name: new RegExp(clinic, "i")
      }).select("_id");

      query.clinic = { $in: clinicMatches.map((c) => c._id) };
    }

    // Filter by PT NAME
    if (pt) {
      const ptMatches = await User.find({
        fullName: new RegExp(pt, "i")
      }).select("_id");

      query.pt = { $in: ptMatches.map((u) => u._id) };
    }

    // Filter Requester NAME
    if (requester) {
      const reqMatches = await User.find({
        fullName: new RegExp(requester, "i")
      }).select("_id");

      query.requester = { $in: reqMatches.map((u) => u._id) };
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const appts = await Appointment.find(query)
      .populate("pt", "fullName email")
      .populate("requester", "fullName email")
      .populate("clinic", "name location")
      .sort({ createdAt: -1 });

    res.json({ appts });
  } catch (err) {
    console.error("ADMIN appointment query error:", err);
    res.status(500).json({ error: "Server error fetching appointments" });
  }
};

// GET SINGLE APPOINTMENT DETAILS
export const getAppointmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid appointment ID" });

    const appointment = await Appointment.findById(id)
      .populate("requester", "fullName email phone")
      .populate("pt", "fullName email phone")
      .populate("clinic", "name address")
      .lean();

    if (!appointment)
      return res.status(404).json({ success: false, message: "Appointment not found" });

    return res.json({ success: true, appointment });
  } catch (err) {
    console.error("Admin appointment details error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch appointment details" });
  }
};

//  UPDATE APPOINTMENT (Admin override)
export const updateAppointment = async (req, res) => {
  try {
    const { status, date, time, physiotherapist, adminNotes } = req.body;

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status,
        scheduledDate: date,
        scheduledTime: time,
        adminNotes,
        pt: physiotherapist,
      },
      { new: true }
    );

    res.json({ success: true, appointment: updated });
  } catch {
    res.status(500).json({ success: false });
  }
};

// DELETE APPOINTMENT
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Appointment.findByIdAndDelete(id);

    if (!deleted)
      return res.status(404).json({ success: false, message: "Appointment not found" });

    return res.json({ success: true, message: "Appointment deleted successfully" });
  } catch (err) {
    console.error("Admin delete appointment error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete appointment" });
  }
};


// -----------------------------------------
// PROMOTIONS CONTROLLER
// -----------------------------------------
export const getAllPromotions = async (req, res) => {
  try {
    const { search, status } = req.query;

    let ptIds = [];

    if (search) {
      const pts = await User.find({
        role: "physiotherapist",
        $or: [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select("_id");
      ptIds = pts.map((p) => p._id);
    }

    // Main promotion query
    const query = {};

    if (ptIds.length > 0) {
      query.pt = { $in: ptIds };
    }

    if (status) {
      query.status = status;
    }

    const promotions = await Promotion.find(query)
      .populate("pt", "fullName email")
      .sort({ createdAt: -1 });

    res.json({ promotions });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get one Promotion
export const getAdminPromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
      .populate("pt", "fullName email");

    res.json({ promotion });
  } catch {
    res.status(500).json({ message: "Unable to fetch promotion" });
  }
};

//UPDATE PROMOTION
export const updateAdminPromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, endAt } = req.body;

    const promotion = await Promotion.findById(id);
    if (!promotion)
      return res.status(404).json({ message: "Promotion not found" });

    // Update status if sent
    if (status) {
      promotion.status = status;
    }

    // Update end date if sent
    if (endAt) {
      const formattedEndAt = new Date(endAt);

      if (isNaN(formattedEndAt)) {
        return res.status(400).json({ message: "Invalid endAt date format" });
      }

      promotion.endAt = formattedEndAt;
    }

    await promotion.save();

    return res.json({
      message: "Promotion updated successfully",
      promotion,
    });
  } catch (err) {
    console.error("Update promotion error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// DELETE PROMOTION
export const deleteAdminPromotion = async (req, res) => {
  try {
    await Promotion.findByIdAndDelete(req.params.id);
    res.json({ message: "Promotion deleted" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
};


// -----------------------------------------
// SUB & SPONSORSHIP CONTROLLER
// -----------------------------------------

//GET SINGLE FORUM SUBS
export const getSingleForumSub = async (req, res) => {
  try {
    const { id } = req.params;

    const sub = await ForumSub.findById(id)
      .populate("createdBy", "name email role")
      .populate("moderators", "name email role");

    if (!sub) {
      return res.status(404).json({ message: "Forum Sub not found" });
    }

    const postCount = await Post.countDocuments({ sub: id });

    return res.status(200).json({
      message: "Forum Sub fetched successfully",
      sub: {
        _id: sub._id,
        title: sub.title,
        slug: sub.slug,
        description: sub.description,
        rules: sub.rules,
        moderators: sub.moderators,
        createdBy: sub.createdBy,
        postCount,

        isSponsored: sub.isSponsored,
        sponsorName: sub.sponsorName,
        sponsorLogo: sub.sponsorLogo,
        sponsorMessage: sub.sponsorMessage,
        sponsorWebsite: sub.sponsorWebsite,
        startDate: sub.startDate,
        endDate: sub.endDate,

        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching forum sub detail:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

//UPDATE SUB SPONSORSHIP
export const updateSponsorship = async (req, res) => {
  const { id } = req.params;

  try {
    const sub = await ForumSub.findById(id);
    if (!sub) return res.status(404).json({ success: false, error: "Forum sub not found" });

    // Convert isSponsored from string to boolean
    const isSponsored = req.body.isSponsored === "true" || req.body.isSponsored === true;

    if (!isSponsored) {
      sub.isSponsored = false;
      sub.sponsorName = "";
      sub.sponsorLogo = "";
      sub.sponsorMessage = "";
      sub.sponsorWebsite = "";
      sub.startDate = null;
      sub.endDate = null;

      await sub.save();
      return res.json({ success: true, message: "Sponsorship disabled", sub });
    }

    // Sponsorship ON → update fields
    sub.isSponsored = true;

    if (req.body.sponsorName !== undefined) sub.sponsorName = req.body.sponsorName;
    if (req.body.sponsorMessage !== undefined) sub.sponsorMessage = req.body.sponsorMessage;
    if (req.body.sponsorWebsite !== undefined) sub.sponsorWebsite = req.body.sponsorWebsite;

    // Logo
    if (req.file) {
      sub.sponsorLogo = `/uploads/sponsor_logo/${req.file.filename}`;
    } else if (req.body.sponsorLogo !== undefined) {
      sub.sponsorLogo = req.body.sponsorLogo;
    }

    // Dates
    if (req.body.startDate) sub.startDate = new Date(req.body.startDate);
    if (req.body.endDate) sub.endDate = new Date(req.body.endDate);

    await sub.save();

    return res.json({ success: true, message: "Sponsorship updated successfully", sub });
  } catch (err) {
    console.error("❌ Error updating sponsorship:", err);
    return res.status(500).json({ success: false, error: "Failed to update sponsorship" });
  }
};

// DELETE SUB
export const deleteSub = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await ForumSub.findById(id);

    if (!sub) {
      return res.status(404).json({ error: "Forum sub not found" });
    }

    // Pre-remove hook will cascade delete posts
    await sub.remove();

    res.json({
      message: `Forum sub "${sub.title}" and its posts have been deleted successfully.`,
    });
  } catch (err) {
    console.error("Error deleting sub:", err);
    res.status(500).json({ error: "Failed to delete forum sub" });
  }
};
