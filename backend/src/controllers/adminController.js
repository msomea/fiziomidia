import ForumSub from "../models/ForumSub.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Promotion from "../models/Promotion.js";
import SponsoredProduct from "../models/SponsoredProduct.js";
import AdminActivityLog from "../models/AdminActivityLog.js";
import escapeRegExp from "../utils/escapeRegExp.js";

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

    // Build all queries in parallel for better performance
    const [
      users,
      appointments,
      promotions,
      sponsoredProducts,
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
      Promotion.find(buildPromotionQuery({ search, status: promotionStatus }))
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

      // Forum Moderator Requests
      ForumSub.find({ isSponsored: true })
        .populate("createdBy", "fullName email")
        .populate("moderators", "fullName email")
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

    return res.json({
      success: true,
      users,
      appointments,
      promotions,
      sponsoredProducts,
      forumSubs: modRequests,
      modRequests, // Keep for compatibility
      adminStats,
      activityLogs: recentActivityLogs,
      lastFetched: new Date(),
    });
  } catch (err) {
    console.error("Dashboard data fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
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
      Promotion.countDocuments(),
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
    console.error("Error getting admin stats:", error);
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

