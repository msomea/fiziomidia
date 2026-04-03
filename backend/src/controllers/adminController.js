import ForumSub from "../models/ForumSub.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import PTPromotion from "../models/PTPromotion.js";
import SponsoredProduct from "../models/SponsoredProduct.js";
import AdminActivityLog from "../models/AdminActivityLog.js";
import ForumSubModRequest from "../models/ForumSubModRequest.js";
import escapeRegExp from "../utils/escapeRegExp.js";
import { CacheService, CacheKeys, CacheTTL } from "../utils/redis.js";

// ============================================
// CONSOLIDATED ADMIN DASHBOARD API
// ============================================
export const getDashboardData = async (req, res) => {
  try {
    const {
      search = "",
      role = "",
      licenseStatus = "",
      clinic = "",
      pt = "",
      requester = "",
      appointmentStatus = "",
      promotionStatus = "",
      productStatus = "",
      page = 1,
      limit = 10,
    } = req.query;

    // Generate cache key based on filters
    const userId = req.user?._id || "anonymous";
    const cacheKey =
      CacheKeys.DASHBOARD_ADMIN(userId) +
      `:filters=${JSON.stringify({ search, role, licenseStatus, clinic, pt, requester, appointmentStatus, promotionStatus, productStatus, page, limit })}`;

    // Try to get from cache first
    const cachedData = await CacheService.get(cacheKey);
    if (cachedData) {
      console.log(`🎯 Admin dashboard cache hit for user: ${userId}`);
      return res.json(cachedData);
    }

    console.log(`💨 Admin dashboard cache miss for user: ${userId}`);

    // Build all queries in parallel for better performance
    const [
      users,
      appointments,
      promotions,
      sponsoredProducts,
      forumSubs,
      modRequests,
      adminStats,
      recentActivityLogs,
    ] = await Promise.all([
      // Users query
      User.find(buildUserQuery({ search, role, licenseStatus }))
        .select("-passwordHash -refreshTokens")
        .sort({ createdAt: -1 })
        .lean()
        .limit(50), // Limit for dashboard preview

      // Appointments query
      Appointment.find(
        buildAppointmentQuery({
          search,
          clinic,
          pt,
          requester,
          status: appointmentStatus,
        }),
      )
        .populate("pt", "fullName email")
        .populate("requester", "fullName email")
        .populate("clinic", "name location")
        .sort({ createdAt: -1 })
        .limit(20),

      // Promotions query
      PTPromotion.find(buildPromotionQuery({ search, status: promotionStatus }))
        .populate("pt", "fullName email")
        .sort({ createdAt: -1 })
        .limit(20),

      // Sponsored Products query
      SponsoredProduct.find(
        buildProductQuery({ search, status: productStatus }),
      )
        .populate("owner", "fullName")
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit)),

      // Forum Subs (all subs for sponsorship management)
      ForumSub.find({})
        .populate("createdBy", "fullName email")
        .populate("moderators", "fullName email")
        .sort({ createdAt: -1 })
        .limit(20),

      // Forum Moderator Requests
      ForumSubModRequest.find({})
        .populate("user", "fullName email role")
        .populate("sub", "title slug")
        .sort({ createdAt: -1 })
        .limit(20),

      // Admin Stats
      getAdminStatsData(),

      // Recent Activity Logs
      AdminActivityLog.find({})
        .populate("admin", "fullName email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const responseData = {
      success: true,
      users,
      appointments,
      promotions,
      sponsoredProducts,
      forumSubs, // All forum subs for sponsorship management
      modRequests, // Forum moderator requests
      adminStats,
      activityLogs: recentActivityLogs,
      lastFetched: new Date(),
    };

    // Cache the response for 5 minutes (dashboard data changes frequently)
    await CacheService.set(cacheKey, responseData, CacheTTL.SHORT);
    console.log(`💾 Admin dashboard cached for user: ${userId}`);

    return res.json(responseData);
  } catch (err) {
    console.error("⚠️Dashboard data fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
};

// Helper function to invalidate admin dashboard cache
async function invalidateAdminDashboardCache(adminId) {
  try {
    await CacheService.delPattern(`dashboard:admin:${adminId}*`);
    console.log(`🗑️ Admin dashboard cache invalidated for admin: ${adminId}`);
  } catch (error) {
    console.error('⚠️ Error invalidating admin dashboard cache:', error);
  }
}

// Helper functions for building queries
function buildUserQuery({ search, role, licenseStatus }) {
  const query = {};

  if (search) {
    const esc = escapeRegExp(search);
    query.$or = [
      { fullName: { $regex: esc, $options: "i" } },
      { email: { $regex: esc, $options: "i" } },
      { phone: { $regex: esc, $options: "i" } },
    ];
  }

  if (role) {
    query.role = role;
  }

  if (licenseStatus) {
    query["ptProfile.licenses"] = {
      $elemMatch: { verificationStatus: licenseStatus },
    };
  }

  return query;
}

function buildAppointmentQuery({ search, clinic, pt, requester, status }) {
  const query = {};

  if (search) {
    const escSearch = escapeRegExp(search);
    query.$or = [
      { notes: new RegExp(escSearch, "i") },
      { adminNotes: new RegExp(escSearch, "i") },
    ];
  }

  if (status) {
    query.status = status;
  }

  // Note: For clinic, pt, and requester filters, we'd need to do name lookups
  // For dashboard preview, we'll keep it simple and not include these complex filters

  return query;
}

function buildPromotionQuery({ search, status }) {
  const query = {};

  if (status) {
    query.status = status;
  }

  // For search, we'd need to lookup PT names - keeping simple for dashboard
  if (search) {
    // Could implement PT name search here if needed
  }

  return query;
}

function buildProductQuery({ search, status }) {
  const query = {};

  if (search) {
    const esc = escapeRegExp(search);
    query.name = { $regex: esc, $options: "i" };
  }

  if (status === "active") {
    query.isActive = true;
  } else if (status === "inactive") {
    query.isActive = false;
  } else if (
    status === "approved" ||
    status === "pending" ||
    status === "rejected"
  ) {
    query.status = status;
  }

  return query;
}

async function getAdminStatsData() {
  try {
    // Get basic counts
    const [
      userCount,
      appointmentCount,
      promotionCount,
      productCount,
      sponsoredSubCount,
    ] = await Promise.all([
      User.countDocuments(),
      Appointment.countDocuments(),
      PTPromotion.countDocuments(),
      SponsoredProduct.countDocuments(),
      ForumSub.countDocuments({ isSponsored: true }),
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await AdminActivityLog.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    return {
      userCount,
      appointmentCount,
      promotionCount,
      productCount,
      sponsoredSubCount,
      recentActivity,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("⚠️ Error getting admin stats:", error);
    return {
      userCount: 0,
      appointmentCount: 0,
      promotionCount: 0,
      productCount: 0,
      sponsoredSubCount: 0,
      recentActivity: 0,
      lastUpdated: new Date(),
      error: "Failed to load some stats",
    };
  }
}

