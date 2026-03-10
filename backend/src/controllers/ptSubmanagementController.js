import ForumSub from "../models/ForumSub.js";
import ForumSubModRequest from "../models/ForumSubModRequest.js";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";

// ============================================
// CONSOLIDATED PT SUBMANAGEMENT PAGE API
// ============================================
export const getPTSubmanagementData = async (req, res) => {
  try {
    const { subId } = req.params;
    const { status = "pending" } = req.query;
    const userId = req.user?._id;

    // Build all queries in parallel for better performance
    const [
      subforum,
      modRequests,
      userPermissions
    ] = await Promise.all([
      // Subforum details
      ForumSub.findById(subId)
        .populate({ 
          path: "createdBy", 
          select: "fullName email",
          strictPopulate: false 
        })
        .populate({ 
          path: "moderators.user", 
          select: "fullName email",
          strictPopulate: false 
        })
        .lean(),

      // Mod requests for this subforum
      ForumSubModRequest.find({ 
        sub: subId,
        status: status 
      })
        .populate({
          path: "user",
          select: "fullName email profileImageUrl",
          strictPopulate: false
        })
        .sort({ createdAt: -1 })
        .lean(),

      // User permissions (check if user is owner or mod)
      userId ? checkUserPermissions(subId, userId) : null
    ]);

    // Check if user has management permissions
    const canManage = userPermissions?.isOwner || userPermissions?.isMod || req.user?.role === "admin";



    if (!canManage) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to manage this subforum" 
      });
    }

    return res.json({
      success: true,
      subforum,
      modRequests,
      userPermissions,
      canManage,
      lastFetched: new Date(),
    });

  } catch (err) {
    console.error("PT Submanagement data fetch error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch subforum management data" 
    });
  }
};

// Helper function to check user permissions
async function checkUserPermissions(subId, userId) {
  try {
    const [subforum, modRequest] = await Promise.all([
      ForumSub.findById(subId)
        .populate({ 
          path: "createdBy", 
          select: "fullName email",
          strictPopulate: false 
        })
        .populate({ 
          path: "moderators.user", 
          select: "fullName email",
          strictPopulate: false 
        })
        .lean(),
      ForumSubModRequest.findOne({ sub: subId, user: userId }).lean()
    ]);

    if (!subforum) return null;

    const isOwner = subforum.createdBy?._id?.toString() === userId.toString();
    const isMod = subforum.moderators?.some(
      mod => mod.user?._id?.toString() === userId.toString()
    );
    const hasPendingRequest = modRequest?.status === "pending";

    return {
      isOwner,
      isMod,
      hasPendingRequest,
      canEdit: isOwner || isMod,
      canManageRequests: isOwner || isMod
    };
  } catch (error) {
    console.error("Error checking user permissions:", error);
    return {
      isOwner: false,
      isMod: false,
      hasPendingRequest: false,
      canEdit: false,
      canManageRequests: false,
      error: "Failed to check permissions"
    };
  }
}

// Helper function to get subforum statistics
async function getSubforumStats(subId) {
  try {
    const [
      totalPosts,
      totalMods,
      pendingRequests,
      approvedRequests
    ] = await Promise.all([
      // Import Post model to count posts
      import("../models/Post.js").then(m => m.default.countDocuments({ sub: subId })),
      ForumSub.findById(subId).then(sub => sub?.moderators?.length || 0),
      ForumSubModRequest.countDocuments({ sub: subId, status: "pending" }),
      ForumSubModRequest.countDocuments({ sub: subId, status: "approved" })
    ]);

    return {
      totalPosts,
      totalMods,
      pendingRequests,
      approvedRequests,
      totalRequests: pendingRequests + approvedRequests,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error("Error getting subforum stats:", error);
    return {
      totalPosts: 0,
      totalMods: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      totalRequests: 0,
      lastUpdated: new Date(),
      error: "Failed to load some stats"
    };
  }
}
