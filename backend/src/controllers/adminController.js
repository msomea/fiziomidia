import ForumSub from "../models/ForumSub.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Promotion from "../models/Promotion.js";

// -----------------------------------------
// LIST USERS
// -----------------------------------------
export const listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .limit(100)
      .lean();

    return res.json({ success: true, users });
  } catch (error) {
    console.error("❌ Admin listUsers error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
};

// -----------------------------------------
// LIST ALL APPOINTMENTS
// -----------------------------------------
export const getAllAppointments = async (req, res) => {
  try {
    const appts = await Appointment.find()
      .populate("pt", "fullName email")
      .populate("requester", "fullName email")
      .populate("clinic", "name address")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, appts });
  } catch (error) {
    console.error("❌ Admin getAllAppointments error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch Appointments" });
  }
};

// -----------------------------------------
// LIST ALL PROMOTIONS
// -----------------------------------------
export const getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate("pt", "fullName email")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({ success: true, promotions });
  } catch (err) {
    console.error("❌ Admin getAllPromotions error:", err);
    return res.status(500).json({ success: false, error: "Failed to fetch promotions" });
  }
};

// -----------------------------------------
// UPDATE OR ADD SPONSORSHIP
// -----------------------------------------
export const updateSponsorship = async (req, res) => {
  const { id } = req.params;
  const {
    sponsorName,
    sponsorLogo,
    sponsorMessage,
    sponsorWebsite,
    startDate,
    endDate,
  } = req.body;

  try {
    const sub = await ForumSub.findById(id);

    if (!sub) {
      return res.status(404).json({ success: false, error: "Forum sub not found" });
    }

    // Mark as sponsored
    sub.isSponsored = true;
    
    // Apply fields only if present (keeps patch behavior safe)
    if (sponsorName !== undefined) sub.sponsorName = sponsorName;
    if (sponsorLogo !== undefined) sub.sponsorLogo = sponsorLogo;
    if (sponsorMessage !== undefined) sub.sponsorMessage = sponsorMessage;
    if (sponsorWebsite !== undefined) sub.sponsorWebsite = sponsorWebsite;

    // Convert dates only if valid
    if (startDate) sub.startDate = new Date(startDate);
    if (endDate) sub.endDate = new Date(endDate);

    await sub.save();

    return res.json({
      success: true,
      message: "Sponsorship updated successfully",
      sub,
    });
  } catch (err) {
    console.error("❌ Error updating sponsorship:", err);
    return res.status(500).json({ success: false, error: "Failed to update sponsorship" });
  }
};

// -----------------------------------------
// REMOVE SPONSORSHIP
// -----------------------------------------
export const removeSponsorship = async (req, res) => {
  const { id } = req.params;

  try {
    const sub = await ForumSub.findById(id);

    if (!sub) {
      return res.status(404).json({ success: false, error: "Forum sub not found" });
    }

    sub.isSponsored = false;
    sub.sponsorName = "";
    sub.sponsorLogo = "";
    sub.sponsorMessage = "";
    sub.sponsorWebsite = "";
    sub.startDate = null;
    sub.endDate = null;

    await sub.save();

    return res.json({
      success: true,
      message: "Sponsorship removed successfully",
      sub,
    });
  } catch (err) {
    console.error("❌ Error removing sponsorship:", err);
    return res.status(500).json({ success: false, error: "Failed to remove sponsorship" });
  }
};
