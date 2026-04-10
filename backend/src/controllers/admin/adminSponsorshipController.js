import ForumSub from "../../models/ForumSub.js";
import ForumSubModRequest from "../../models/ForumSubModRequest.js";
import { CacheService } from "../../utils/redis.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../services/uploadService.js";
import Post from "../../models/Post.js";
import {
  logAdminActivity,
  getSponsorshipTargetInfo,
  getForumSubTargetInfo,
} from "../../middlewares/adminActivityLogger.js";
import { fetchForumSubs } from "../adminController.js";

// -----------------------------------------
// SUB & SPONSORSHIP CONTROLLER
// -----------------------------------------

//GET ALL FORUM SUBS
export const getAllForumSubs = async (req, res) => {
  try {
    // Use shared fetchForumSubs function
    const subs = await fetchForumSubs();

    res.json({ 
      success: true,
      subs,
      message: "Forum subs fetched successfully"
    });
  } catch (error) {
    console.error("Error fetching forum subs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch forum subs",
      error: error.message,
    });
  }
};

//GET SINGLE FORUM SUBS
export const getSingleForumSub = async (req, res) => {
  try {
    const { id } = req.params;

    const sub = await ForumSub.findById(id)
      .populate("createdBy", "fullName email role")
      .populate("moderators", "fullName email role");

    if (!sub) {
      return res.status(404).json({ message: "Forum Sub not found" });
    }

    const postCount = await Post.countDocuments({ sub: id });

    return res.status(200).json({
      message: "Forum Sub fetched successfully",
      sub: {
        _id: sub._id,
        title: sub.title,
        slug: sub.slug,
        description: sub.description,
        rules: sub.rules,
        moderators: sub.moderators,
        createdBy: sub.createdBy,
        postCount,

        isSponsored: sub.isSponsored,
        sponsorName: sub.sponsorName,
        sponsorLogo: sub.sponsorLogo,
        sponsorMessage: sub.sponsorMessage,
        sponsorWebsite: sub.sponsorWebsite,
        startDate: sub.startDate,
        endDate: sub.endDate,

        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching forum sub detail:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

//UPDATE SUB SPONSORSHIP
export const updateSponsorship = [
  logAdminActivity("SPONSORSHIP_UPDATED", getSponsorshipTargetInfo),
  async (req, res) => {
    const { id } = req.params;

    try {
      const sub = await ForumSub.findById(id);
      if (!sub) {
        return res.status(404).json({
          success: false,
          error: "Forum sub not found",
        });
      }

      // Convert isSponsored safely
      const isSponsored =
        req.body.isSponsored === true || req.body.isSponsored === "true";

      /* --------------------------------------------------
       Sponsorship OFF → reset everything
    -------------------------------------------------- */
      if (!isSponsored) {
        // Remove logo from Cloudinary if exists
        if (sub.sponsorLogoPublicId) {
          await deleteFromCloudinary(sub.sponsorLogoPublicId);
        }

        sub.isSponsored = false;
        sub.sponsorTitle = { en: "", sw: "" };
        sub.sponsorName = { en: "", sw: "" };
        sub.sponsorLogo = "";
        sub.sponsorLogoPublicId = "";
        sub.sponsorMessage = { en: "", sw: "" };
        sub.sponsorWebsite = "";
        sub.startDate = null;
        sub.endDate = null;

        await sub.save();

        // Invalidate admin dashboard cache due to sponsorship removal
        await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
        console.log(
          `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to sponsorship removal`,
        );

        return res.json({
          success: true,
          message: "Sponsorship disabled",
          sub,
        });
      }

      /* --------------------------------------------------
       Sponsorship ON → update fields
    -------------------------------------------------- */
      sub.isSponsored = true;

      /* Sponsor Title (multilingual) */
      if (req.body.sponsorTitle !== undefined) {
        sub.sponsorTitle =
          typeof req.body.sponsorTitle === "string"
            ? JSON.parse(req.body.sponsorTitle)
            : req.body.sponsorTitle;
      }

      /* Sponsor Name (multilingual) */
      if (req.body.sponsorName !== undefined) {
        sub.sponsorName =
          typeof req.body.sponsorName === "string"
            ? JSON.parse(req.body.sponsorName)
            : req.body.sponsorName;
      }

      /* Sponsor Message (multilingual) */
      if (req.body.sponsorMessage !== undefined) {
        sub.sponsorMessage =
          typeof req.body.sponsorMessage === "string"
            ? JSON.parse(req.body.sponsorMessage)
            : req.body.sponsorMessage;
      }

      if (req.body.sponsorWebsite !== undefined)
        sub.sponsorWebsite = req.body.sponsorWebsite;

      // Handle logo upload
      if (req.file) {
        // Delete old logo if exists
        if (sub.sponsorLogoPublicId) {
          await deleteFromCloudinary(sub.sponsorLogoPublicId);
        }

        const result = await uploadToCloudinary(req.file);

        sub.sponsorLogo = result.secure_url;
        sub.sponsorLogoPublicId = result.public_id;
      }

      // Dates
      if (req.body.startDate) sub.startDate = new Date(req.body.startDate);

      if (req.body.endDate) sub.endDate = new Date(req.body.endDate);

      await sub.save();

      // Invalidate admin dashboard cache due to sponsorship removal
      await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
      console.log(
        `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to sponsorship removal`,
      );

      return res.json({
        success: true,
        message: "Sponsorship updated successfully",
        sub,
      });
    } catch (err) {
      console.error("❌ Error updating sponsorship:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to update sponsorship",
      });
    }
  },
];

// DELETE SUB
export const deleteSub = [
  logAdminActivity("FORUM_SUB_DELETED", getForumSubTargetInfo),
  async (req, res) => {
    try {
      const { id } = req.params;
      const sub = await ForumSub.findById(id);

      if (!sub) {
        return res.status(404).json({ error: "Forum sub not found" });
      }

      const subTitle = sub.title;

      // Pre-remove hook will cascade delete posts
      await sub.remove();

      res.json({
        message: `Forum sub "${subTitle}" and its posts have been deleted successfully.`,
      });
    } catch (err) {
      console.error("Error deleting sub:", err);
      res.status(500).json({ error: "Failed to delete forum sub" });
    }
  },
];
