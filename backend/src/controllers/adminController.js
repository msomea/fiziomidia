import ForumSub from "../models/ForumSub.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import PTPromotion from "../models/PTPromotion.js";
import SponsoredProduct from "../models/SponsoredProduct.js";
import AdminActivityLog from "../models/AdminActivityLog.js";
import ForumSubModRequest from "../models/ForumSubModRequest.js";
import Clinic from "../models/Clinic.js";
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

    // Build all queries in parallel for better performance using shared functions
    const [
      users,
      appointments,
      promotions,
      sponsoredProducts,
      forumSubs,
      modRequests,
      adminStats,
      recentActivityLogs,
      clinicPromotions,
    ] = await Promise.all([
      // Users query
      fetchUsers({ search, role, licenseStatus, limit: 50 }),

      // Appointments query
      fetchAppointments({
        search,
        clinic,
        pt,
        requester,
        status: appointmentStatus,
        limit: 20,
      }),

      // Promotions query
      fetchPromotions({ search, status: promotionStatus, limit: 20 }),

      // Sponsored Products query
      fetchSponsoredProducts({
        search,
        status: productStatus,
        limit: parseInt(limit),
      }),

      // Forum Subs (all subs for sponsorship management)
      fetchForumSubs({ limit: 20 }),

      // Forum Moderator Requests
      fetchModRequests({ limit: 20 }),

      // Admin Stats
      getAdminStatsData(),

      // Recent Activity Logs
      AdminActivityLog.find({})
        .populate("admin", "fullName email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Clinic Promotions
      fetchClinicPromotions({ limit: 20 }),
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
      clinicPromotions, // Clinic promotions for management
      lastFetched: new Date(),
    };

    // Cache the response for 5 minutes (dashboard data changes frequently)
    await CacheService.set(cacheKey, responseData, CacheTTL.SHORT);
    console.log(`💾 Admin dashboard cached for user: ${userId}`);

    return res.json(responseData);
  } catch (err) {
    console.error("⚠️ Dashboard data fetch error:", err);
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

// ============================================
// SHARED DATA FETCHING FUNCTIONS
// ============================================

// Shared function to fetch users with filtering
export const fetchUsers = async ({ search, role, licenseStatus, limit = null, skip = null }) => {
  const query = buildUserQuery({ search, role, licenseStatus });
  
  let userQuery = User.find(query)
    .select("-passwordHash -refreshTokens")
    .sort({ createdAt: -1 })
    .lean();
  
  if (limit) userQuery = userQuery.limit(parseInt(limit));
  if (skip) userQuery = userQuery.skip(parseInt(skip));
  
  return await userQuery;
};

// Shared function to fetch appointments with filtering
export const fetchAppointments = async ({ search, clinic, pt, requester, status, limit = null, skip = null }) => {
  const query = await buildAppointmentQuery({ search, clinic, pt, requester, status });
  
  let apptQuery = Appointment.find(query)
    .populate("pt", "fullName email")
    .populate("requester", "fullName email")
    .populate("clinic", "name location")
    .sort({ createdAt: -1 });
  
  if (limit) apptQuery = apptQuery.limit(parseInt(limit));
  if (skip) apptQuery = apptQuery.skip(parseInt(skip));
  
  return await apptQuery;
};

// Shared function to fetch promotions with filtering
export const fetchPromotions = async ({ search, status, limit = null, skip = null }) => {
  const query = await buildPromotionQuery({ search, status });
  
  let promoQuery = PTPromotion.find(query)
    .populate("pt", "fullName email")
    .sort({ createdAt: -1 });
  
  if (limit) promoQuery = promoQuery.limit(parseInt(limit));
  if (skip) promoQuery = promoQuery.skip(parseInt(skip));
  
  return await promoQuery;
};

// Shared function to fetch sponsored products with filtering
export const fetchSponsoredProducts = async ({ search, status, limit = null, skip = null }) => {
  const query = buildProductQuery({ search, status });
  
  let productQuery = SponsoredProduct.find(query)
    .populate("owner", "fullName")
    .sort({ updatedAt: -1 });
  
  if (limit) productQuery = productQuery.limit(parseInt(limit));
  if (skip) productQuery = productQuery.skip(parseInt(skip));
  
  return await productQuery;
};

// Shared function to fetch forum subs with filtering
export const fetchForumSubs = async ({ limit = null, skip = null }) => {
  let subQuery = ForumSub.find({})
    .populate("createdBy", "fullName email")
    .populate("moderators", "fullName email")
    .sort({ createdAt: -1 });
  
  if (limit) subQuery = subQuery.limit(parseInt(limit));
  if (skip) subQuery = subQuery.skip(parseInt(skip));
  
  return await subQuery;
};

// Shared function to fetch moderator requests with filtering
export const fetchModRequests = async ({ status = null, search = "", limit = null, skip = null }) => {
  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { "user.fullName": { $regex: search, $options: "i" } },
      { "user.email": { $regex: search, $options: "i" } },
      { "sub.title": { $regex: search, $options: "i" } },
    ];
  }
  
  let modQuery = ForumSubModRequest.find(query)
    .populate("user", "fullName email role")
    .populate("sub", "title slug")
    .sort({ createdAt: -1 });
  
  if (limit) modQuery = modQuery.limit(parseInt(limit));
  if (skip) modQuery = modQuery.skip(parseInt(skip));
  
  return await modQuery;
};

// Shared function to fetch clinic promotions with filtering
export const fetchClinicPromotions = async ({ search = "", status = "", limit = null, skip = null }) => {
  // Import here to avoid circular dependency
  const { default: ClinicPromotion } = await import("../models/ClinicPromotion.js");
  const { default: Clinic } = await import("../models/Clinic.js");
  
  const query = {};
  
  // Search by clinic name or address
  if (search) {
    const esc = escapeRegExp(search);
    // Get clinic IDs that match the search
    const clinicMatches = await Clinic.find({
      $or: [
        { name: { $regex: esc, $options: "i" } },
        { address: { $regex: esc, $options: "i" } },
      ],
    }).select("_id");
    
    if (clinicMatches.length > 0) {
      query.clinic = { $in: clinicMatches.map((c) => c._id) };
    } else {
      // If no clinics match, return empty result
      query.clinic = { $in: [] };
    }
  }
  
  // Filter by status
  if (status) {
    query.status = status;
  }
  
  let promoQuery = ClinicPromotion.find(query)
    .populate({
      path: "clinic",
      select: "name address ownerUserId",
      populate: {
        path: "ownerUserId",
        select: "fullName email phone",
        model: "User"
      }
    })
    .sort({ createdAt: -1 });
  
  if (limit) promoQuery = promoQuery.limit(parseInt(limit));
  if (skip) promoQuery = promoQuery.skip(parseInt(skip));
  
  return await promoQuery;
};

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

async function buildAppointmentQuery({
  search,
  clinic,
  pt,
  requester,
  status,
}) {
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

  // Filter by clinic NAME
  if (clinic) {
    const escClinic = escapeRegExp(clinic);
    const clinicMatches = await Clinic.find({
      name: new RegExp(escClinic, "i"),
    }).select("_id");
    query.clinic = { $in: clinicMatches.map((c) => c._id) };
  }

  // Filter by PT NAME
  if (pt) {
    const escPt = escapeRegExp(pt);
    const ptMatches = await User.find({
      fullName: new RegExp(escPt, "i"),
    }).select("_id");
    query.pt = { $in: ptMatches.map((u) => u._id) };
  }

  // Filter Requester NAME
  if (requester) {
    const escReq = escapeRegExp(requester);
    const reqMatches = await User.find({
      fullName: new RegExp(escReq, "i"),
    }).select("_id");
    query.requester = { $in: reqMatches.map((u) => u._id) };
  }

  return query;
}

async function buildPromotionQuery({ search, status }) {
  const query = {};

  if (status) {
    query.status = status;
  }

  // Handle PT name search
  if (search) {
    const esc = escapeRegExp(search);
    const pts = await User.find({
      role: "physiotherapist",
      $or: [
        { fullName: { $regex: esc, $options: "i" } },
        { email: { $regex: esc, $options: "i" } },
      ],
    }).select("_id");

    if (pts.length > 0) {
      query.pt = { $in: pts.map((p) => p._id) };
    } else {
      // If no PTs match, return empty result
      query.pt = { $in: [] };
    }
  }

  return query;
}

export function buildProductQuery({ search, status }) {
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

