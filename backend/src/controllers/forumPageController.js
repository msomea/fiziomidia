import ForumSub from "../models/ForumSub.js";
import Post from "../models/Post.js";
import ForumSubModRequest from "../models/ForumSubModRequest.js";
import asyncHandler from "express-async-handler";
import { CacheService, CacheKeys, CacheTTL } from "../utils/redis.js";

// ============================================
// CONSOLIDATED FORUM PAGE API
// ============================================
export const getForumPageData = async (req, res) => {
  try {
    const { subId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user?._id;

    // Generate cache key
    const cacheKey = CacheKeys.FORUM_POSTS(subId, page);

    // Try to get from cache first (only for non-authenticated users or cache without user-specific data)
    if (!userId) {
      const cachedData = await CacheService.get(cacheKey);
      if (cachedData) {
        console.log(
          `🎯 Forum posts cache hit for sub: ${subId}, page: ${page}`,
        );
        return res.json(cachedData);
      }
      console.log(`💨 Forum posts cache miss for sub: ${subId}, page: ${page}`);
    }

    // Build all queries in parallel for better performance
    const [subforum, posts, modRequestStatus] = await Promise.all([
      // Subforum details
      ForumSub.findById(subId)
        .populate({
          path: "createdBy",
          select: "fullName email",
          strictPopulate: false,
        })
        .populate({
          path: "moderators.user",
          select: "fullName email",
          strictPopulate: false,
        })
        .lean(),

      // Posts for this subforum
      Post.find({ sub: subId })
        .populate({
          path: "author",
          select: "fullName role profileImageUrl",
          strictPopulate: false,
        })
        .populate({
          path: "sub",
          select: "title slug isSponsored",
          strictPopulate: false,
        })
        .sort({ pinned: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean(),

      // Mod request status (only for PT users)
      userId && req.user.role === "physiotherapist"
        ? ForumSubModRequest.findOne({
            sub: subId,
            user: userId,
          }).lean()
        : null,
    ]);

    // Check if user is moderator or owner
    let isMod = false;
    let isOwner = false;
    let hasPendingRequest = false;

    if (userId && subforum) {
      isOwner = subforum.createdBy?._id?.toString() === userId;
      isMod = subforum.moderators?.some(
        (mod) => mod.user?._id?.toString() === userId,
      );
      hasPendingRequest = modRequestStatus?.status === "pending";
    }

    const responseData = {
      success: true,
      subforum,
      posts,
      userPermissions: {
        isMod,
        isOwner,
        hasPendingRequest,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: posts.length === parseInt(limit),
      },
      lastFetched: new Date(),
    };

    // Cache the response for 15 minutes (forum posts change moderately)
    if (!userId) {
      await CacheService.set(cacheKey, responseData, CacheTTL.MEDIUM);
      console.log(`💾 Forum posts cached for sub: ${subId}, page: ${page}`);
    }

    return res.json(responseData);
  } catch (err) {
    console.error("Forum page data fetch error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch forum page data" 
    });
  }
};

// Helper function to invalidate forum cache
async function invalidateForumCache(subId) {
  try {
    await CacheService.delPattern(`forum:sub:${subId}*`);
    console.log(`🗑️ Forum cache invalidated for sub: ${subId}`);
  } catch (error) {
    console.error('Error invalidating forum cache:', error);
  }
}

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
