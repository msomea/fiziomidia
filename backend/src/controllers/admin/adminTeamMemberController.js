import TeamMember from "../../models/TeamMember.js";
import { CacheService, CacheKeys } from "../../utils/redis.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../services/uploadService.js";
import {
  logAdminActivity,
  getTeamMemberTargetInfo,
} from "../../middlewares/adminActivityLogger.js";

const emailRegex = /^\S+@\S+\.\S+$/;

const invalidateTeamMembersCache = () => CacheService.del(CacheKeys.TEAM_MEMBERS());

const parseBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return value === true || value === "true";
};

const parseSortOrder = (value, fallback = 0) => {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const listTeamMembers = async (req, res) => {
  try {
    const members = await TeamMember.find({})
      .select("_id name title email bio image isActive sortOrder createdAt updatedAt")
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    return res.json({ success: true, members });
  } catch (err) {
    console.error("Failed to list team members:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to list team members",
    });
  }
};

export const createTeamMember = [
  logAdminActivity("TEAM_MEMBER_CREATED", getTeamMemberTargetInfo),
  async (req, res) => {
    let uploadedImage = null;

    try {
      const name = String(req.body.name || "").trim();
      const title = String(req.body.title || "").trim();
      const email = String(req.body.email || "").trim().toLowerCase();
      const bio = String(req.body.bio || "").trim();
      const sortOrder = parseSortOrder(req.body.sortOrder, 0);

      if (!name || !title || !email) {
        return res.status(400).json({
          success: false,
          message: "Name, title and email are required",
        });
      }

      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email address",
        });
      }

      if (sortOrder === null) {
        return res.status(400).json({
          success: false,
          message: "Invalid sort order",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Team member image is required",
        });
      }

      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({
          success: false,
          message: "Only image files are allowed",
        });
      }

      uploadedImage = await uploadToCloudinary(req.file);

      const member = await TeamMember.create({
        name,
        title,
        email,
        bio,
        image: uploadedImage.secure_url,
        imagePublicId: uploadedImage.public_id,
        isActive: parseBoolean(req.body.isActive, true),
        sortOrder,
      });

      await invalidateTeamMembersCache();

      return res.status(201).json({
        success: true,
        message: "Team member created",
        member,
      });
    } catch (err) {
      if (uploadedImage?.public_id) {
        await deleteFromCloudinary(uploadedImage.public_id).catch((deleteErr) =>
          console.error("Failed to delete uploaded team member image:", deleteErr),
        );
      }

      console.error("Failed to create team member:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to create team member",
      });
    }
  },
];

export const updateTeamMember = [
  logAdminActivity("TEAM_MEMBER_UPDATED", getTeamMemberTargetInfo),
  async (req, res) => {
    let uploadedImage = null;
    let previousImagePublicId = null;

    try {
      const member = await TeamMember.findById(req.params.id);
      if (!member) {
        return res.status(404).json({
          success: false,
          message: "Team member not found",
        });
      }

      if (req.body.name !== undefined) {
        member.name = String(req.body.name).trim();
      }

      if (req.body.title !== undefined) {
        member.title = String(req.body.title).trim();
      }

      if (req.body.email !== undefined) {
        const email = String(req.body.email).trim().toLowerCase();
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: "Invalid email address",
          });
        }
        member.email = email;
      }

      if (req.body.bio !== undefined) {
        member.bio = String(req.body.bio || "").trim();
      }

      if (req.body.sortOrder !== undefined) {
        const sortOrder = parseSortOrder(req.body.sortOrder, member.sortOrder);
        if (sortOrder === null) {
          return res.status(400).json({
            success: false,
            message: "Invalid sort order",
          });
        }
        member.sortOrder = sortOrder;
      }

      if (req.body.isActive !== undefined) {
        member.isActive = parseBoolean(req.body.isActive, member.isActive);
      }

      if (!member.name || !member.title || !member.email) {
        return res.status(400).json({
          success: false,
          message: "Name, title and email are required",
        });
      }

      if (req.file) {
        if (!req.file.mimetype.startsWith("image/")) {
          return res.status(400).json({
            success: false,
            message: "Only image files are allowed",
          });
        }

        previousImagePublicId = member.imagePublicId;
        uploadedImage = await uploadToCloudinary(req.file);
        member.image = uploadedImage.secure_url;
        member.imagePublicId = uploadedImage.public_id;
      }

      try {
        await member.save();
      } catch (saveErr) {
        if (uploadedImage?.public_id) {
          await deleteFromCloudinary(uploadedImage.public_id).catch((deleteErr) =>
            console.error("Failed to delete uploaded team member image:", deleteErr),
          );
        }
        throw saveErr;
      }

      if (
        uploadedImage &&
        previousImagePublicId &&
        previousImagePublicId !== member.imagePublicId
      ) {
        await deleteFromCloudinary(previousImagePublicId).catch((deleteErr) =>
          console.error("Failed to delete previous team member image:", deleteErr),
        );
      }

      await invalidateTeamMembersCache();

      return res.json({
        success: true,
        message: "Team member updated",
        member,
      });
    } catch (err) {
      console.error("Failed to update team member:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to update team member",
      });
    }
  },
];

export const deleteTeamMember = [
  logAdminActivity("TEAM_MEMBER_DELETED", getTeamMemberTargetInfo),
  async (req, res) => {
    try {
      const member = await TeamMember.findByIdAndDelete(req.params.id);
      if (!member) {
        return res.status(404).json({
          success: false,
          message: "Team member not found",
        });
      }

      if (member.imagePublicId) {
        await deleteFromCloudinary(member.imagePublicId).catch((deleteErr) =>
          console.error("Failed to delete team member image:", deleteErr),
        );
      }

      await invalidateTeamMembersCache();

      return res.json({
        success: true,
        message: "Team member deleted",
      });
    } catch (err) {
      console.error("Failed to delete team member:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to delete team member",
      });
    }
  },
];
