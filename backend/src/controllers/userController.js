import User from "../models/User.js";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

const SALT_ROUNDS = 10;

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // store avatars and licenses in separate folders depending on fieldname
    const base = "./uploads";
    const dir =
      file.fieldname === "licenseDocument"
        ? path.join(base, "licenses")
        : path.join(base, "avatars");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const suffix = file.fieldname === "licenseDocument" ? "-license" : "";
    cb(null, `${req.user._id}${suffix}${path.extname(file.originalname)}`);
  },
});

export const uploadAvatar = multer({ storage });

// Get current user's profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select(
      "-passwordHash -refreshTokens"
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
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

    // load existing user to merge ptProfile safely
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

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
    } = req.body;

    // ptProfile may be sent as a JSON string in FormData under 'ptProfile'
    let ptProfilePayload = {};
    if (req.body.ptProfile) {
      try {
        ptProfilePayload =
          typeof req.body.ptProfile === "string"
            ? JSON.parse(req.body.ptProfile)
            : req.body.ptProfile;
      } catch (err) {
        console.warn("Failed to parse ptProfile payload", err);
        ptProfilePayload = {};
      }
    }

    const updateData = {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(location && { location }),
      ...(bio && { bio }),
      ...(profileImageUrl && { profileImageUrl }),
    };

    // Handle uploads (avatar and license)
    // multer.fields will populate req.files as an object of arrays
    if (req.files) {
      if (req.files.avatar && req.files.avatar[0]) {
        updateData.profileImageUrl = `/uploads/avatars/${req.files.avatar[0].filename}`;
      }
      if (req.files.licenseDocument && req.files.licenseDocument[0]) {
        // ensure ptProfile exists in updateData
        ptProfilePayload.licenseImageUrl = `/uploads/licenses/${req.files.licenseDocument[0].filename}`;
      }
    }

    // Hash new password if provided
    if (password) {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      updateData.passwordHash = hash;
    }

    // Merge ptProfile payload with existing profile (if any)
    if (Object.keys(ptProfilePayload).length > 0) {
      // ensure we keep existing nested fields unless overwritten
      const existing = user.ptProfile ? user.ptProfile.toObject() : {};
      const merged = {
        ...existing,
        ...ptProfilePayload,
      };

      // keep yearsOfExperience as string if provided
      if (
        merged.yearsOfExperience &&
        typeof merged.yearsOfExperience !== "string"
      ) {
        merged.yearsOfExperience = String(merged.yearsOfExperience);
      }

      updateData.ptProfile = merged;
    }

    // Handle upgrade to physiotherapist explicitly if requested
    if (
      upgradeToPhysiotherapist === true ||
      upgradeToPhysiotherapist === "true"
    ) {
      if (user.role === "physiotherapist") {
        // already a PT — nothing to do
      } else {
        updateData.role = "physiotherapist";
        updateData.ptProfile = {
          ...(updateData.ptProfile || {}),
          licenseVerified: false,
          licenseVerificationStatus: "pending",
          promotionActiveUntil: null,
        };
      }
    }

    // Perform update
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: upgradeToPhysiotherapist
        ? "Profile updated and upgraded to Physiotherapist"
        : "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};




