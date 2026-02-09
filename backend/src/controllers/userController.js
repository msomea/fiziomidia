import User from "../models/User.js";
import bcrypt from "bcrypt";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/uploadService.js";


const SALT_ROUNDS = 10;

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
    const user = await User.findById(id).select("-passwordHash"); // hide passwordHash
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE CURRENT USER PROFILE
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Load existing user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const {
      fullName,
      email,
      phone,
      location,
      bio,
      password,
      upgradeToPhysiotherapist,
    } = req.body;

    const updateData = {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(bio && { bio }),
    };

    // --------------------------
    // Handle Location
    // --------------------------
    if (location) {
      let loc = typeof location === "string" ? JSON.parse(location) : location;
      updateData.location = {
        type: "Point",
        coordinates: loc?.coordinates || [0, 0],
        region: loc?.region,
        district: loc?.district,
        ward: loc?.ward,
        street: loc?.street,
      };
    }

    // --------------------------
    // Avatar Upload
    // --------------------------
    if (req.files?.avatar?.[0]) {
      // Delete old avatar if exists
      if (user.profileImageUrl?.includes("cloudinary")) {
        const oldPublicId = user.profileImageUrl.split("/").pop().split(".")[0];
        await deleteFromCloudinary(`avatars/${oldPublicId}`);
      }

      const uploaded = await uploadToCloudinary(req.files.avatar[0]);
      updateData.profileImageUrl = uploaded.secure_url;
    }

    // --------------------------
    // PT Profile Handling
    // --------------------------
    let ptProfilePayload = {};
    if (req.body.ptProfile) {
      ptProfilePayload =
        typeof req.body.ptProfile === "string"
          ? JSON.parse(req.body.ptProfile)
          : req.body.ptProfile;
    }

    // Initialize ptProfile if not present
    if (!user.ptProfile) user.ptProfile = {};

    // --------------------------
    // License Upload
    // --------------------------
    if (req.files?.licenseDocument?.[0]) {
      const licenseFile = req.files.licenseDocument[0];

      // Delete previous license if exists
      const oldLicenseUrl = user.ptProfile?.licenses?.[0]?.licenseFileUrl;
      if (oldLicenseUrl?.includes("cloudinary")) {
        const oldPublicId = oldLicenseUrl.split("/").pop().split(".")[0];
        await deleteFromCloudinary(`licenses/${oldPublicId}`, "raw");
      }

      const uploadedLicense = await uploadToCloudinary(licenseFile);
      const newLicense = {
        licenseNumber: req.body.licenseNumber || ptProfilePayload?.licenses?.[0]?.licenseNumber || "",
        licenseFileUrl: uploadedLicense.secure_url,
        licenseFileType: licenseFile.mimetype,
        verificationStatus: "pending",
        verified: false,
        submittedAt: new Date(),
      };

      updateData.ptProfile = {
        ...(user.ptProfile?.toObject?.() || user.ptProfile),
        licenses: [newLicense],
      };
    }

    // --------------------------
    // Merge ptProfile payload (gallery, experience, etc.)
    // --------------------------
    if (Object.keys(ptProfilePayload).length > 0) {
      const merged = {
        ...(user.ptProfile?.toObject?.() || user.ptProfile),
        ...ptProfilePayload,
      };

      // Merge gallery images if new ones uploaded
      if (req.files?.galleryImages?.length > 0) {
        const galleryUploads = await Promise.all(
          req.files.galleryImages.map((file) => uploadToCloudinary(file))
        );

        const galleryItems = galleryUploads.map((up, i) => ({
          imageUrl: up.secure_url,
          caption:
            typeof req.body.galleryCaption === "string"
              ? req.body.galleryCaption
              : req.body.galleryCaption?.[i] || "",
          uploadedAt: new Date(),
        }));

        merged.gallery = [...(merged.gallery || []), ...galleryItems];
      }

      updateData.ptProfile = merged;
    }

    // --------------------------
    // Email uniqueness
    // --------------------------
    if (email && email !== user.email) {
      const other = await User.findOne({ email });
      if (other && other._id.toString() !== userId.toString()) {
        return res.status(409).json({ error: "Email already in use" });
      }
    }

    // --------------------------
    // Password hashing
    // --------------------------
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // --------------------------
    // Upgrade to Physiotherapist
    // --------------------------
    if (upgradeToPhysiotherapist === true || upgradeToPhysiotherapist === "true") {
      if (!updateData.ptProfile?.licenses?.[0]) {
        return res.status(400).json({ error: "License document required" });
      }
      updateData.role = "pendingPhysiotherapist";
      updateData.physioApproval = false;
    }

    // --------------------------
    // Save user
    // --------------------------
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-passwordHash");

    res.json({
      message: upgradeToPhysiotherapist
        ? "Profile updated and upgraded to Physiotherapist"
        : "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
