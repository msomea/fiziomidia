import User from "../models/User.js";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

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
      profileImageUrl,
      // Upgrade to physiotherapist
      upgradeToPhysiotherapist, // boolean or string "true"
      institution,
      isPrivatePractice,
      clinicIds,
      licenseImageUrl,
      licenseNumber,
      speciality,
      yearsOfExperience,
      workingHours,
    } = req.body;

    const updateData = {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(location && { location }),
      ...(bio && { bio }),
      ...(profileImageUrl && { profileImageUrl }),
    };

    // Handle avatar upload (if multer used)
    if (req.file) {
      updateData.profileImageUrl = `/uploads/avatars/${req.file.filename}`;
    }

    // Hash new password if provided
    if (password) {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      updateData.passwordHash = hash;
    }

    // 🔹 Handle Member → Physiotherapist upgrade
    if (upgradeToPhysiotherapist === true || upgradeToPhysiotherapist === "true") {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (user.role === "physiotherapist") {
        return res
          .status(400)
          .json({ error: "User is already a Physiotherapist" });
      }

      updateData.role = "physiotherapist";
      updateData.ptProfile = {
        institution,
        isPrivatePractice: isPrivatePractice !== undefined ? isPrivatePractice : true,
        clinicIds: clinicIds ? [].concat(clinicIds) : [],
        licenseImageUrl,
        licenseNumber,
        bio,
        speciality: speciality ? [].concat(speciality) : [],
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
        workingHours: workingHours || [],
        licenseVerified: false,
        promotionActiveUntil: null,
      };
    }

    // Perform update
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message:
        upgradeToPhysiotherapist
          ? "Profile updated and upgraded to Physiotherapist"
          : "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};




