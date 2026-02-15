import User from "../models/User.js";
import bcrypt from "bcrypt";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/uploadService.js";


const SALT_ROUNDS = 10;
// Get all users (for messaging - can be optimized later with pagination/search)
export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;

    const filter = {};

    if (role && role !== "all") {
      filter.role = role;
    }

    // Exclude current logged in user
    const users = await User.find({
      ...filter,
      _id: { $ne: req.user._id },
    })
      .select("_id fullName profileImageUrl role isLoggedIn")
      .collation({ locale: "en", strength: 2 }) 
      .sort({ fullName: 1 });

    res.status(200).json(users);
  } catch (error) {
    console.error("Fetch users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

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

    // -------------------------------------------------
    // Load user
    // -------------------------------------------------
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

    const updateData = {};

    // -------------------------------------------------
    // Basic fields (prevent role tampering)
    // -------------------------------------------------
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (bio) updateData.bio = bio;

    // -------------------------------------------------
    // Location handling
    // -------------------------------------------------
    if (location) {
      const loc = typeof location === "string" ? JSON.parse(location) : location;

      updateData.location = {
        type: "Point",
        coordinates: loc?.coordinates || [0, 0],
        region: loc?.region,
        district: loc?.district,
        ward: loc?.ward,
        street: loc?.street,
      };
    }

    // -------------------------------------------------
    // Avatar Upload
    // -------------------------------------------------
    if (req.files?.avatar?.[0]) {
      if (user.profileImagePublicId) {
        await deleteFromCloudinary(user.profileImagePublicId);
      }

      const uploaded = await uploadToCloudinary(req.files.avatar[0]);

      updateData.profileImageUrl = uploaded.secure_url;
      updateData.profileImagePublicId = uploaded.public_id;
    }

    // -------------------------------------------------
    // Email uniqueness check
    // -------------------------------------------------
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== userId.toString()) {
        return res.status(409).json({ error: "Email already in use" });
      }
    }

    // -------------------------------------------------
    // Password hashing
    // -------------------------------------------------
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // -------------------------------------------------
    // PT Profile handling
    // -------------------------------------------------
    let ptProfile = user.ptProfile?.toObject?.() || {};

    // Parse incoming ptProfile
    let ptProfilePayload = {};
    if (req.body.ptProfile) {
      ptProfilePayload =
        typeof req.body.ptProfile === "string"
          ? JSON.parse(req.body.ptProfile)
          : req.body.ptProfile;
    }

    // Merge base PT profile
    ptProfile = { ...ptProfile, ...ptProfilePayload };

    // -------------------------------------------------
    // License Upload (safe replace)
    // -------------------------------------------------
    if (req.files?.licenseDocument?.[0]) {
      const licenseFile = req.files.licenseDocument[0];

      // Delete previous license safely
      const oldLicense = ptProfile?.licenses?.[0];
      if (oldLicense?.licenseFilePublicId) {
        await deleteFromCloudinary(oldLicense.licenseFilePublicId);
      }

      const uploadedLicense = await uploadToCloudinary(licenseFile);

      const newLicense = {
        licenseNumber:
          req.body.licenseNumber ||
          ptProfilePayload?.licenses?.[0]?.licenseNumber ||
          "",
        licenseFileUrl: uploadedLicense.secure_url,
        licenseFilePublicId: uploadedLicense.public_id,
        licenseFileType: licenseFile.mimetype,
        verificationStatus: "pending",
        verified: false,
        submittedAt: new Date(),
      };

      ptProfile.licenses = [newLicense];
    }

    // -------------------------------------------------
    // Gallery Upload
    // -------------------------------------------------
    if (req.files?.galleryImages?.length > 0) {
      const uploads = await Promise.all(
        req.files.galleryImages.map((file) => uploadToCloudinary(file))
      );

      const galleryItems = uploads.map((up, i) => ({
        imageUrl: up.secure_url,
        imagePublicId: up.public_id,
        caption:
          typeof req.body.galleryCaption === "string"
            ? req.body.galleryCaption
            : req.body.galleryCaption?.[i] || "",
        uploadedAt: new Date(),
      }));

      ptProfile.gallery = [...(ptProfile.gallery || []), ...galleryItems];
    }

    updateData.ptProfile = ptProfile;

    // -------------------------------------------------
    // Upgrade to Physiotherapist (STRICT VALIDATION)
    // -------------------------------------------------
    if (upgradeToPhysiotherapist === true || upgradeToPhysiotherapist === "true") {

      if (user.role === "pendingPhysiotherapist") {
        return res.status(400).json({ error: "Upgrade request already pending" });
      }

      if (user.role === "physiotherapist") {
        return res.status(400).json({ error: "Already a physiotherapist" });
      }

      const license = ptProfile?.licenses?.[0];

      if (!license?.licenseNumber) {
        return res.status(400).json({ error: "License number required" });
      }

      if (!license?.licenseFileUrl) {
        return res.status(400).json({ error: "License document required" });
      }

      if (!ptProfile?.institution) {
        return res.status(400).json({ error: "Institution required" });
      }

      if (!ptProfile?.yearsOfExperience) {
        return res.status(400).json({ error: "Years of experience required" });
      }

      if (!ptProfile?.speciality?.length) {
        return res.status(400).json({ error: "At least one speciality required" });
      }

      updateData.role = "pendingPhysiotherapist";
      updateData.physioApproval = false;
      updateData.upgradeRequestedAt = new Date();
    }

    // -------------------------------------------------
    // Save user
    // -------------------------------------------------
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    res.json({
      message:
        upgradeToPhysiotherapist === true ||
        upgradeToPhysiotherapist === "true"
          ? "Upgrade request submitted successfully"
          : "Profile updated successfully",
      user: updatedUser,
    });

  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

