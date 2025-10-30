import ForumSub from "../models/ForumSub.js";
import User from "../models/User.js";

// List all users (admin only)
export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").limit(100);
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// List all Appointments
export const getAllAppointments = async (req, res) => {
  try {
    const appts = await Appointment.find()
    .sort({ createdAt: -1 });
    res.json({ appts });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch Appointments" });
  }
  
};

// 🔹 Update or Add Sponsorship
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
    if (!sub) return res.status(404).json({ error: "Forum sub not found" });

    sub.isSponsored = true;
    sub.sponsorName = sponsorName || "";
    sub.sponsorLogo = sponsorLogo || "";
    sub.sponsorMessage = sponsorMessage || "";
    sub.sponsorWebsite = sponsorWebsite || "";
    sub.startDate = startDate ? new Date(startDate) : undefined;
    sub.endDate = endDate ? new Date(endDate) : undefined;

    await sub.save();
    res.json({ message: "Sponsorship updated successfully", sub });
  } catch (err) {
    console.error("Error updating sponsorship:", err);
    res.status(500).json({ error: "Failed to update sponsorship" });
  }
};

// 🔹 Remove Sponsorship
export const removeSponsorship = async (req, res) => {
  const { id } = req.params;

  try {
    const sub = await ForumSub.findById(id);
    if (!sub) return res.status(404).json({ error: "Forum sub not found" });

    sub.isSponsored = false;
    sub.sponsorName = "";
    sub.sponsorLogo = "";
    sub.sponsorMessage = "";
    sub.sponsorWebsite = "";
    sub.startDate = undefined;
    sub.endDate = undefined;

    await sub.save();
    res.json({ message: "Sponsorship removed successfully", sub });
  } catch (err) {
    console.error("Error removing sponsorship:", err);
    res.status(500).json({ error: "Failed to remove sponsorship" });
  }
};
