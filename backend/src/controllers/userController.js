import User from "../models/User.js";
import bcrypt from "bcrypt";
import { upload as uploadMiddleware } from "../services/uploadService.js";

// Export upload for backward compatibility with any code that imported
// `upload` from this controller. Prefer using the central service directly
// (import from ../services/uploadService.js) in new code.
export const upload = uploadMiddleware;

const SALT_ROUNDS = 10;

// Note: upload handling is provided by the centralized upload service
// (backend/src/services/uploadService.js). This controller no longer
// defines a local multer instance to avoid duplication and inconsistent
// destination folders.

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
      const loc =
        typeof location === "string" ? JSON.parse(location) : location;

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
    // 3️⃣ Handle avatar and gallery file uploads ONLY (license handled later)
    // --------------------------------------------
    // collect newly uploaded gallery items here so they are in scope
    // for later merging with the client's ptProfile payload
    let newGallery = [];

    if (req.files) {
      // Avatar upload
      if (req.files.avatar && req.files.avatar[0]) {
        updateData.profileImageUrl = `/uploads/avatars/${req.files.avatar[0].filename}`;
      }

      // NOTE: licenseDocument handling is deferred until after parsing
      // ptProfilePayload so we can attach the generated filename to the
      // corresponding license entry inside the payload.

      // Gallery Images
      if (req.files.galleryImages?.length > 0) {
        if (!updateData.ptProfile) updateData.ptProfile = {};

        // Support multiple captions
        // If frontend sends single string, convert to array for consistency
        const captions =
          typeof req.body.galleryCaption === "string"
            ? [req.body.galleryCaption]
            : req.body.galleryCaption || [];
        newGallery = req.files.galleryImages.map((file, i) => ({
          imageUrl: `/uploads/gallery/${file.filename}`,
          caption: captions[i] || "",
          uploadedAt: new Date(),
        }));

        // Merge with existing gallery if any
        const existingGallery = user.ptProfile?.gallery || [];
        updateData.ptProfile.gallery = [...existingGallery, ...newGallery];
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
    // Merge if there is data. Special handling for `gallery`:
    // - If frontend provided `ptProfile.gallery` (even an empty array),
    //   treat that as the set of kept images and append any newly
    //   uploaded images (newGallery).
    // - If frontend did NOT provide `gallery`, preserve the current
    //   updateData.ptProfile.gallery (which may include existing + new).
    if (Object.keys(ptProfilePayload).length > 0) {
      const merged = {
        ...(user.ptProfile?.toObject?.() || user.ptProfile || {}),
        ...ptProfilePayload,
      };

      const hasGalleryInPayload = Object.prototype.hasOwnProperty.call(
        ptProfilePayload,
        "gallery"
      );

      let finalGallery = [];
      if (hasGalleryInPayload) {
        // frontend explicitly provided gallery -> keep those and append new uploads
        finalGallery = [...(ptProfilePayload.gallery || []), ...newGallery];
      } else if (updateData.ptProfile && updateData.ptProfile.gallery) {
        // use the gallery we assembled earlier (existing + new)
        finalGallery = updateData.ptProfile.gallery;
      } else {
        finalGallery = [...(user.ptProfile?.gallery || []), ...newGallery];
      }

      merged.gallery = finalGallery;

      // Enforce string for yearsOfExperience
      if (
        merged.yearsOfExperience &&
        typeof merged.yearsOfExperience !== "string"
      ) {
        merged.yearsOfExperience = String(merged.yearsOfExperience);
      }

      updateData.ptProfile = merged;
    }

    // --------------------------------------------
    // 4️⃣b Attach uploaded license file to the corresponding license entry
    // --------------------------------------------
    if (
      req.files &&
      req.files.licenseDocument &&
      req.files.licenseDocument[0]
    ) {
      const filename = req.files.licenseDocument[0].filename;
      const licenseUrl = `/uploads/licenses/${filename}`;

      // If client provided licenses in payload, attach to the last added
      // license (frontend appends new licenses to the end before submit).
      if (
        ptProfilePayload &&
        Array.isArray(ptProfilePayload.licenses) &&
        ptProfilePayload.licenses.length > 0
      ) {
        const idx = ptProfilePayload.licenses.length - 1;
        ptProfilePayload.licenses[idx].licenseFileUrl = licenseUrl;
        ptProfilePayload.licenses[idx].uploadedAt = new Date();

        // Ensure updateData.ptProfile exists and merge the modified payload
        updateData.ptProfile = {
          ...(updateData.ptProfile || {}),
          ...(user.ptProfile?.toObject?.() || user.ptProfile || {}),
          ...ptProfilePayload,
        };
      } else {
        // Fallback: add/overwrite top-level licenseImageUrl for backward compat
        if (!updateData.ptProfile) updateData.ptProfile = {};
        updateData.ptProfile.licenseImageUrl = licenseUrl;
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
    if (
      upgradeToPhysiotherapist === true ||
      upgradeToPhysiotherapist === "true"
    ) {
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
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

