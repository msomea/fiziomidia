import User from "../models/User.js";
import Promotion from "../models/Promotion.js";

// Get current user's profile
export const getProfile = async (req, res) => {
  res.json({ user: req.user });
};

// Get a single user by ID (public profile)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password"); // hide password
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update current user's profile
export const updateProfile = async (req, res) => {
  const { fullName, contactPhone, profileImage } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (fullName) user.fullName = fullName;
    if (contactPhone) user.contactPhone = contactPhone;
    if (profileImage) user.profileImage = profileImage;

    await user.save();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// List all users (admin only)
export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").limit(100);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get all physiotherapists (PTs) with active promotions
export const getPTsWithActivePromotions = async (req, res) => {
  try {
    // Find all active promotions
    const activePromotions = await Promotion.find({ status: "active" });

    // Get all physiotherapists linked to active promotions
    const ptIds = activePromotions.map((promo) => promo.pt);
    console.log("Active Promotions →", activePromotions);

    const pts = await User.find({
      _id: { $in: ptIds },
      role: "physiotherapist",
    }).select("-password");
    console.log("PTs with Active Promotions →", pts);
    res.status(200).json(pts);
    

  } catch (error) {
    console.error("Error fetching PTs with promotions:", error);
    res.status(500).json({ message: "Server Error" });
  }
};