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


// PUT /api/users/profile
// =========================================
// UPDATE CURRENT USER PROFILE (FULL FIXED)
// =========================================

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Load existing user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Extract simple fields from body
    const {
      fullName,
      email,
      phone,
      location,
      bio,
      password,
      upgradeToPhysiotherapist,
    } = req.body;

    // ---------------------------------------------------
    // 1️⃣ Prepare updateData
    // ---------------------------------------------------
    const updateData = {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(bio && { bio }),
    };

    // --------------------------------------------
    // 2️⃣ Handle Location (parse and add to updateData)
    // --------------------------------------------
    if (location) {
      const loc = typeof location === "string" ? JSON.parse(location) : location;

      updateData.location = {
        type: "Point",
        coordinates: loc.coordinates || [0, 0],
        region: loc.region,
        district: loc.district,
        ward: loc.ward,
        street: loc.street,
      };
    }

    // --------------------------------------------
    // 3️⃣ Handle avatar / license file uploads ONLY
    // --------------------------------------------
    if (req.files) {
      // Avatar upload
      if (req.files.avatar && req.files.avatar[0]) {
        updateData.profileImageUrl = `/uploads/avatars/${req.files.avatar[0].filename}`;
      }

      // License upload
      if (req.files.licenseDocument && req.files.licenseDocument[0]) {
        if (!updateData.ptProfile) updateData.ptProfile = {};
        updateData.ptProfile.licenseImageUrl = `/uploads/licenses/${req.files.licenseDocument[0].filename}`;
      }
    }

    // --------------------------------------------
    // 4️⃣ Handle ptProfile merging cleanly
    // --------------------------------------------
    let ptProfilePayload = {};

    if (req.body.ptProfile) {
      try {
        ptProfilePayload =
          typeof req.body.ptProfile === "string"
            ? JSON.parse(req.body.ptProfile)
            : req.body.ptProfile;
      } catch (err) {
        console.warn("Failed to parse ptProfile", err);
      }
    }

    // Merge if there is data
    if (Object.keys(ptProfilePayload).length > 0) {
      updateData.ptProfile = {
        ...(user.ptProfile?.toObject?.() || user.ptProfile || {}),
        ...ptProfilePayload,
      };

      // Enforce string for yearsOfExperience
      if (
        updateData.ptProfile.yearsOfExperience &&
        typeof updateData.ptProfile.yearsOfExperience !== "string"
      ) {
        updateData.ptProfile.yearsOfExperience =
          String(updateData.ptProfile.yearsOfExperience);
      }
    }

    // ------------------------------------------------------------
    // 5️⃣ Handle password hashing IF password was changed
    // ------------------------------------------------------------
    if (password) {
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      updateData.passwordHash = hash;
    }

    // ------------------------------------------------------------
    // 6️⃣ Handle upgrade to physiotherapist
    // ------------------------------------------------------------
    if (upgradeToPhysiotherapist === true || upgradeToPhysiotherapist === "true") {
      if (user.role !== "physiotherapist") {
        updateData.role = "physiotherapist";
        updateData.ptProfile = {
          ...(updateData.ptProfile || {}),
          licenseVerified: false,
          licenseVerificationStatus: "pending",
          promotionActiveUntil: null,
        };
      }
    }

    // ------------------------------------------------------------
    // 7️⃣ Save and return final updated user
    // ------------------------------------------------------------
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-passwordHash");
    res.json({
      message: upgradeToPhysiotherapist
        ? "Profile updated and upgraded to Physiotherapist"
        : "Profile updated successfully",
      user: updatedUser,
    });
    console.log("✅ ✅ Update Data from frontend", updateData)
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

