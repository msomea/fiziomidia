import ForumSub from "../models/ForumSub.js";
import User from "../models/User.js";
import Clinic from "../models/Clinic.js";
import Appointment from "../models/Appointment.js";
import Promotion from "../models/Promotion.js";
import mongoose from "mongoose";
import Post from "../models/Post.js";
import SponsoredProduct from "../models/SponsoredProduct.js";
import asyncHandler from "express-async-handler";
import escapeRegExp from "../utils/escapeRegExp.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/uploadService.js";
import { sendEmail, EMAIL_FROM} from "../services/sendEmailService.js";
import { generateFiziomidiaEmail } from "../templates/emailHelper.js";

// -------------------------------------------
// USERS CONTROLER
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
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    const validRoles = ["member", "physiotherapist", "pendingPhysiotherapist", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    user.role = role;

    // 🔥 IMPORTANT FIX: If user is changed back to member → wipe PT data
    if (role === "member") {
      user.ptProfile = null;
      user.physioApproval = false;
    }

    await user.save();

    return res.json({
      success: true,
      message: "Role updated successfully",
      user,
    });
  } catch (err) {
    console.error("Update role error:", err);
    return res.status(500).json({ success: false, message: "Failed to update user role" });
  }
};
;

// VERIFY OR REJECT PT LICENSE
export const updateLicenseStatus = asyncHandler( async (req, res) => {
  try {
    const { status, notes, index } = req.body;

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

    if (!user.ptProfile || !user.ptProfile.licenses?.length) {
      return res.status(400).json({ success: false, message: "No licenses found for this user" });
    }

    // ✅ Select license by index (fallback to first)
    const licenseDoc =
      typeof index === "number"
        ? user.ptProfile.licenses[index]
        : user.ptProfile.licenses[0];

    if (!licenseDoc) {
      return res.status(404).json({ success: false, message: "License not found" });
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
      (lic) => lic.verificationStatus === "approved"
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

    // Generate email
    const emailHTML = generateFiziomidiaEmail({
      title: "🎉 License Approved!",
      body: `
        <p>Hello ${user.fullName || "there"},</p>
        <p>Great news! Your professional license has been <strong>approved</strong>.</p>
        <p>You now have full access to the Fiziomidia platform features.</p>
        <p>We’re excited to have you onboard and look forward to your contribution.</p>
      `,
      buttonText: "Login",
      buttonURL: `https://fiziomidia.org/login`
    });

    // Send email (non-blocking safe pattern)
    try {
      await sendEmail({
        from: EMAIL_FROM.ADMIN,
        to: user.email,
        subject: "Your License Has Been Approved - FizioMidia",
        html: emailHTML
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
    res.status(500).json({ success: false, message: "Failed to update license status" });
  }
}
);



// ============================================
// ADMIN SEND EMAIL TO USER
export const sendEmailToUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, body, buttonText, buttonURL, logoURL } = req.body;

  // Validate required fields
  if (!title || !body) {
    return res.status(400).json({
      success: false,
      message: "Email title and body are required"
    });
  }

  // Find user
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  // Generate branded email HTML
  const emailHTML = generateFiziomidiaEmail({
    title,
    body,
    buttonText,
    buttonURL,
    logoURL : "https://api.fiziomidia.org/api/logo"
  });

  // Send email
  try {
    await sendEmail({
      to: user.email,
      from: EMAIL_FROM.ADMIN,
      subject: title,
      html: emailHTML
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully"
    });
  } catch (err) {
    console.error("Admin send email error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to send email"
    });
  }
});


// APPOINTMENTS CONTROLLER
// ============================================
export const getAllAppointments = async (req, res) => {
  try {
    const { search = "", clinic = "", pt = "", requester = "", status = "" } = req.query;

    // Build dynamic query
    let query = {};

    // global search
    if (search) {
      const escSearch = escapeRegExp(search);
      query.$or = [
        { notes: new RegExp(escSearch, "i") },
        { adminNotes: new RegExp(escSearch, "i") },
      ];
    }

    // Filter by clinic NAME
    if (clinic) {
      const escClinic = escapeRegExp(clinic);
      const clinicMatches = await Clinic.find({
        name: new RegExp(escClinic, "i"),
      }).select("_id");

      query.clinic = { $in: clinicMatches.map((c) => c._id) };
    }

    // Filter by PT NAME
    if (pt) {
      const escPt = escapeRegExp(pt);
      const ptMatches = await User.find({
        fullName: new RegExp(escPt, "i"),
      }).select("_id");

      query.pt = { $in: ptMatches.map((u) => u._id) };
    }

    // Filter Requester NAME
    if (requester) {
      const escReq = escapeRegExp(requester);
      const reqMatches = await User.find({
        fullName: new RegExp(escReq, "i"),
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
// PT PROMOTIONS CONTROLLER
// -----------------------------------------
export const getAllPromotions = async (req, res) => {
  try {
    const { search, status } = req.query;

    let ptIds = [];

    if (search) {
      const esc = escapeRegExp(search);
      const pts = await User.find({
        role: "physiotherapist",
        $or: [
          { fullName: { $regex: esc, $options: "i" } },
          { email: { $regex: esc, $options: "i" } },
        ],
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

    // Update end date if provided
    if (endAt) {
      const formattedEndAt = new Date(endAt);
      if (isNaN(formattedEndAt)) {
        return res.status(400).json({ message: "Invalid endAt date format" });
      }
      promotion.endAt = formattedEndAt;
    }

    // Determine current status
    const now = new Date();

    if (status === "suspended") {
      // Suspended promotions stay suspended until reactivated
      promotion.status = "suspended";
    } else if (promotion.endAt && promotion.endAt < now) {
      // If endAt is past, mark as expired
      promotion.status = "expired";
    } else {
      // Otherwise active
      promotion.status = "active";
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
      .populate("createdBy", "fullName email role")
      .populate("moderators", "fullName email role");

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
    if (!sub) {
      return res.status(404).json({
        success: false,
        error: "Forum sub not found",
      });
    }

    // Convert isSponsored safely
    const isSponsored =
      req.body.isSponsored === true ||
      req.body.isSponsored === "true";

    /* --------------------------------------------------
       Sponsorship OFF → reset everything
    -------------------------------------------------- */
    if (!isSponsored) {
      // Remove logo from Cloudinary if exists
      if (sub.sponsorLogoPublicId) {
        await deleteFromCloudinary(sub.sponsorLogoPublicId);
      }

      sub.isSponsored = false;
      sub.sponsorTitle = { en: "", sw: "" };
      sub.sponsorName = { en: "", sw: "" };
      sub.sponsorLogo = "";
      sub.sponsorLogoPublicId = "";
      sub.sponsorMessage = { en: "", sw: "" };
      sub.sponsorWebsite = "";
      sub.startDate = null;
      sub.endDate = null;

      await sub.save();

      return res.json({
        success: true,
        message: "Sponsorship disabled",
        sub,
      });
    }

    /* --------------------------------------------------
       Sponsorship ON → update fields
    -------------------------------------------------- */
    sub.isSponsored = true;

    /* Sponsor Title (multilingual) */
    if (req.body.sponsorTitle !== undefined) {
      sub.sponsorTitle =
        typeof req.body.sponsorTitle === "string"
          ? JSON.parse(req.body.sponsorTitle)
          : req.body.sponsorTitle;
    }

    /* Sponsor Name (multilingual) */
    if (req.body.sponsorName !== undefined) {
      sub.sponsorName =
        typeof req.body.sponsorName === "string"
          ? JSON.parse(req.body.sponsorName)
          : req.body.sponsorName;
    }

    /* Sponsor Message (multilingual) */
    if (req.body.sponsorMessage !== undefined) {
      sub.sponsorMessage =
        typeof req.body.sponsorMessage === "string"
          ? JSON.parse(req.body.sponsorMessage)
          : req.body.sponsorMessage;
    }

    if (req.body.sponsorWebsite !== undefined)
      sub.sponsorWebsite = req.body.sponsorWebsite;

    // Handle logo upload
    if (req.file) {
      // Delete old logo if exists
      if (sub.sponsorLogoPublicId) {
        await deleteFromCloudinary(sub.sponsorLogoPublicId);
      }

      const result = await uploadToCloudinary(req.file);

      sub.sponsorLogo = result.secure_url;
      sub.sponsorLogoPublicId = result.public_id;
    }

    // Dates
    if (req.body.startDate)
      sub.startDate = new Date(req.body.startDate);

    if (req.body.endDate)
      sub.endDate = new Date(req.body.endDate);

    await sub.save();

    return res.json({
      success: true,
      message: "Sponsorship updated successfully",
      sub,
    });
  } catch (err) {
    console.error("❌ Error updating sponsorship:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to update sponsorship",
    });
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

// -----------------------------------------
// PROMOTED PRODUCTS
// -----------------------------------------

// Create a new Sponsored Product
export const createSponsoredProduct = async (req, res) => {
  try {
    // Convert isActive / isSponsored safely
    const isActive =
      req.body.isActive === "true" || req.body.isActive === true;

    const productData = {
      name: req.body.name,
      description: req.body.description || "",
      price: req.body.price,
      sponsorName: req.body.sponsorName || "",
      sponsorWebsite: req.body.sponsorWebsite || "",
      sponsorMessage: req.body.sponsorMessage || "",
      isActive,
    };

    // Handle image / logo upload
    if (req.file) {
      productData.image = `/uploads/sponsored_products/${req.file.filename}`;
    }

    // Optional dates
    if (req.body.startDate) {
      productData.startDate = new Date(req.body.startDate);
    }

    if (req.body.endDate) {
      productData.endDate = new Date(req.body.endDate);
    }

    const product = new SponsoredProduct(productData);
    await product.save();

    return res.status(201).json({
      success: true,
      message: "Sponsored product created successfully",
      product,
    });
  } catch (err) {
    console.error("❌ Create sponsored product error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to create sponsored product",
    });
  }
};

// List all Sponsored Products with pagination
export const getAllSponsoredProducts = async (req, res) => {
  try {
    const { search = "", status = "", page = 1 } = req.query;

    const filter = {};

    // Search by product name
    if (search) {
      const esc = escapeRegExp(search);
      filter.name = { $regex: esc, $options: "i" };
    }

    // Filter by active / inactive
    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    } else if (status === "approved") {
      filter.status = "approved"
    } else if (status === "pending") {
      filter.status = "pending"
    } else if (status === "rejected") {
      filter.status = "rejected"
    }
    


    const limit = 10;
    const skip = (page - 1) * limit;

    const products = await SponsoredProduct.find(filter)
      .populate("owner", "fullName")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await SponsoredProduct.countDocuments(filter);

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch sponsored products" });
  }
};


// Get single product
export const getSponsoredProductById = async (req, res) => {
  try {
    const product = await SponsoredProduct.findById(req.params.id)
    .populate("owner", "fullName");
    if (!product) return res.status(404).json({ error: "Not found" });

    res.json(product);
  } catch (err) {
    console.error("Fetch one error:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

// Update Sponsored Product
// Update Sponsored Product (ADMIN)
export const updateSponsoredProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const product = await SponsoredProduct.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Sponsored product not found",
      });
    }

    /* =========================
       BASIC FIELDS
    ========================== */
    if (req.body.name !== undefined) product.name = req.body.name;
    if (req.body.category !== undefined) product.category = req.body.category;
    if (req.body.description !== undefined)
      product.description = req.body.description;

    if (req.body.price !== undefined) {
      const price = Number(req.body.price);
      if (Number.isNaN(price)) {
        return res.status(400).json({
          success: false,
          error: "Invalid price value",
        });
      }
      product.price = price;
    }

    if (req.body.duration !== undefined) {
      const duration = Number(req.body.duration);
      if (Number.isNaN(duration)) {
        return res.status(400).json({
          success: false,
          error: "Invalid duration value",
        });
      }
      product.duration = duration;
    }

    if (req.body.link !== undefined) product.link = req.body.link;

    /* =========================
       STATUS CHANGE (ADMIN ONLY)
       pending | approved | rejected
       Dates & activation handled by schema hook
    ========================== */
    if (req.body.status !== undefined) {
      const validStatus = ["pending", "approved", "rejected"];
      if (!validStatus.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          error: "Invalid status value",
        });
      }

      product.status = req.body.status;
    }

    /* =========================
       MANUAL ACTIVE TOGGLE
       (Only allowed if approved)
    ========================== */
    if (req.body.isActive !== undefined) {
      const isActive =
        req.body.isActive === true || req.body.isActive === "true";

      if (isActive && product.status !== "approved") {
        return res.status(400).json({
          success: false,
          error: "Only approved products can be activated",
        });
      }

      product.isActive = isActive;
    }

    /* =========================
       IMAGE HANDLING
    ========================== */
    if (req.file) {
      product.image = `/uploads/products/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      product.image = req.body.image;
    }

    await product.save(); // triggers schema hooks

    return res.json({
      success: true,
      message: "Sponsored product updated successfully",
      product,
    });
  } catch (err) {
    console.error("❌ Error updating sponsored product:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to update sponsored product",
    });
  }
};



// Delete Sponsored Product (ADMIN)
export const deleteSponsoredProduct = async (req, res) => {
  try {
    const product = await SponsoredProduct.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Sponsored product not found",
      });
    }

    return res.json({
      success: true,
      message: "Sponsored product deleted successfully",
    });
  } catch (err) {
    console.error("❌ Delete sponsored product error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to delete sponsored product",
    });
  }
};

