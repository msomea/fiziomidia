import User from "../models/User.js";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { profile } from "console";

const SALT_ROUNDS = 10;

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/avatars";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user._id}${path.extname(file.originalname)}`);
  },
});

export const uploadAvatar = multer({ storage });

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
// PUT /api/users/profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      fullName,
      email,
      phone,
      location,
      bio,
      password,
      profileImageUrl
    } = req.body;

    const updateData = {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(location && { location }),
      ...(bio && { bio }),
      ...(profileImageUrl && { profileImageUrl }), // for direct URL updates
    };

    // Handle avatar upload (from multer)
    if (req.file) {
      updateData.profileImageUrl = `/uploads/avatars/${req.file.filename}`;
    }

    // Hash password if provided
    if (password) {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      updateData.passwordHash = hash;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true, // return updated document
    }).select("-passwordHash"); // exclude password hash from response

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};



