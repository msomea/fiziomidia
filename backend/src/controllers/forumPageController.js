import ForumSub from "../models/ForumSub.js";
import Post from "../models/Post.js";
import ForumSubModRequest from "../models/ForumSubModRequest.js";
import asyncHandler from "express-async-handler";

// ============================================
// CONSOLIDATED FORUM PAGE API
// ============================================
export const getForumPageData = async (req, res) => {
  try {
    const { subId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user?._id;

    // Build all queries in parallel for better performance
    const [
      subforum,
      posts,
      modRequestStatus
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

      // Posts for this subforum
      Post.find({ sub: subId })
        .populate({ 
          path: "createdBy", 
          select: "fullName profileImageUrl",
          strictPopulate: false 
        })
        .populate({ 
          path: "sub", 
          select: "title slug isSponsored",
          strictPopulate: false 
        })
        .sort({ pinned: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean(),

      // Mod request status (only for PT users)
      userId && req.user.role === "physiotherapist"
        ? ForumSubModRequest.findOne({ 
            sub: subId, 
            user: userId 
          }).lean()
        : null
    ]);

    // Check if user is moderator or owner
    let isMod = false;
    let isOwner = false;
    let hasPendingRequest = false;

    if (userId && subforum) {
      isOwner = subforum.createdBy?._id?.toString() === userId;
      isMod = subforum.moderators?.some(
        mod => mod.user?._id?.toString() === userId
      );
      hasPendingRequest = modRequestStatus?.status === "pending";
    }

    return res.json({
      success: true,
      subforum,
      posts,
      userPermissions: {
        isMod,
        isOwner,
        hasPendingRequest
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit)
      },
      lastFetched: new Date(),
    });

  } catch (err) {
    console.error("Forum page data fetch error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch forum page data" 
    });
  }
};

// Helper function to get forum statistics
async function getForumStats(subId) {
  try {
    const [
      totalPosts,
      totalMods,
      activeModRequests
    ] = await Promise.all([
      Post.countDocuments({ sub: subId }),
      ForumSub.findById(subId).then(sub => sub?.moderators?.length || 0),
      ForumSubModRequest.countDocuments({ 
        sub: subId, 
        status: "pending" 
      })
    ]);

    return {
      totalPosts,
      totalMods,
      activeModRequests,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error("Error getting forum stats:", error);
    return {
      totalPosts: 0,
      totalMods: 0,
      activeModRequests: 0,
      lastUpdated: new Date(),
      error: "Failed to load some stats"
    };
  }
}
