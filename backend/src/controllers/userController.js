import User from "../models/User.js";
import bcrypt from "bcrypt";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../services/uploadService.js";
import { CacheService, CacheKeys, CacheTTL } from "../utils/redis.js";


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
    const cacheKey = CacheKeys.USER_PROFILE(userId);

    // Try to get from cache first
    const cachedUser = await CacheService.get(cacheKey);
    if (cachedUser) {
      console.log(`🎯 User profile cache hit for user: ${userId}`);
      return res.json(cachedUser);
    }

    console.log(`💨 User profile cache miss for user: ${userId}`);

    const user = await User.findById(userId)
    .select("-passwordHash -refreshTokens")
    .populate("savedPTs", "fullName profileImageUrl ptProfile.speciality")
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Cache the user profile for 30 minutes
    await CacheService.set(cacheKey, user, CacheTTL.MEDIUM);
    console.log(`💾 User profile cached for user: ${userId}`);

    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// Helper function to invalidate user profile cache
async function invalidateUserProfileCache(userId) {
  try {
    await CacheService.del(CacheKeys.USER_PROFILE(userId));
    console.log(`🗑️ User profile cache invalidated for user: ${userId}`);
  } catch (error) {
    console.error('Error invalidating user profile cache:', error);
  }
}

// Get a single user by ID (public profile)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select("-passwordHash  -refreshTokens "); 
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
      const loc =
        typeof location === "string" ? JSON.parse(location) : location;

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
        req.files.galleryImages.map((file) => uploadToCloudinary(file)),
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
    if (
      upgradeToPhysiotherapist === true ||
      upgradeToPhysiotherapist === "true"
    ) {
      if (user.role === "pendingPhysiotherapist") {
        return res
          .status(400)
          .json({ error: "Upgrade request already pending" });
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
        return res
          .status(400)
          .json({ error: "At least one speciality required" });
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

    // Invalidate user profile cache
    await invalidateUserProfileCache(userId);

    res.json({
      message:
        upgradeToPhysiotherapist === true || upgradeToPhysiotherapist === "true"
          ? "Upgrade request submitted successfully"
          : "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Toggle save/unsave a PT for a member
export const toggleSavePT = async (req, res) => {
  try {
    const memberId = req.user._id;
    const { ptId } = req.params;

    const member = await User.findById(memberId);

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    const alreadySaved = member.savedPTs.includes(ptId);

    if (alreadySaved) {
      member.savedPTs = member.savedPTs.filter((id) => id.toString() !== ptId);
    } else {
      member.savedPTs.push(ptId);
    }

    await member.save();

    // Invalidate user profile cache
    await invalidateUserProfileCache(memberId);

    res.status(200).json({
      success: true,
      saved: !alreadySaved,
    });
  } catch (error) {
    console.error("Toggle save PT error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Preferred Language
export const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({
        success: false,
        error: "Language is required",
      });
    }

    if (!["en", "sw"].includes(language)) {
      return res.status(400).json({
        success: false,
        error: "Invalid language selection",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    user.language = language;
    await user.save();

    // Invalidate user profile cache due to language change
    await CacheService.del(`user:${user._id}:profile`);
    console.log(
      `🗑️ User profile cache invalidated for user: ${user._id} due to language change`,
    );

    return res.status(200).json({
      success: true,
      message: "Language updated successfully",
      language: user.language,
    });
  } catch (error) {
    console.error("Update language error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// Search physiotherapists
export const searchPhysiotherapists = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const users = await User.find({
      role: "physiotherapist",
      isActive: true,
      isBanned: false,
      fullName: { 
        $regex: q.trim(), 
        $options: "i" 
      }
    })
    .select("fullName email profileImageUrl ptProfile.speciality")
    .limit(10)
    .sort({ fullName: 1 });

    res.json(users);
  } catch (error) {
    console.error("Error searching physiotherapists:", error);
    res.status(500).json({ error: "Failed to search physiotherapists" });
  }
};

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = CacheKeys.USER_NOTIFICATIONS(id);
    
    // Try to get from cache first
    const cachedNotifications = await CacheService.get(cacheKey);
    if (cachedNotifications) {
      return res.json(cachedNotifications);
    }

    const notifications = await User.findById(id)
      .select('notifications')
      .lean();
    
    // Sort by date (newest first) and filter unread only
    const sortedNotifications = notifications?.notifications?.filter(n => !n.read)
      .sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ) || [];

    // Cache the result
    await CacheService.set(cacheKey, sortedNotifications, CacheTTL.NOTIFICATIONS);
    
    res.json(sortedNotifications);
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { notificationId } = req.body;
    
    if (!notificationId) {
      return res.status(400).json({ error: "Notification ID is required" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find and update the notification
    const notification = user.notifications.id(notificationId);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.read = true;
    notification.readAt = new Date();
    
    await user.save();

    // Clear cache
    await CacheService.del(CacheKeys.USER_NOTIFICATIONS(id));
    
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};
