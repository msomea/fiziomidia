import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Post from "../models/Post.js";
import Promotion from "../models/Promotion.js";
import Clinic from "../models/Clinic.js";
import asyncHandler from "express-async-handler";

// ============================================
// CONSOLIDATED PT DASHBOARD API
// ============================================
export const getPTDashboardData = async (req, res) => {
  try {
    const { id: ptId } = req.params;
    const { limit = 3 } = req.query;

    // Build all queries in parallel for better performance
    const [ptProfile, clinics, appointments, forumPosts, promotion, stats] =
      await Promise.all([
        // PT Profile query
        User.findById(ptId).select("-passwordHash -refreshTokens"),

        // Clinics query - NEW
        Clinic.find({ ownerUserId: ptId })
          .populate("ownerUserId", "fullName email phone")
          .populate("physiotherapists", "fullName email phone"),

        // Appointments query
        Appointment.find({ pt: ptId })
          .populate("requester", "fullName email phone")
          .populate("clinic", "name location address")
          .sort({ appointmentDate: 1 })
          .limit(parseInt(limit)),

        // Forum Posts query
        Post.find({ createdBy: ptId })
          .populate("sub", "title slug")
          .sort({ createdAt: -1 })
          .limit(parseInt(limit)),

        // Promotion query
        Promotion.findOne({ pt: ptId }).sort({ createdAt: -1 }),

        // Dashboard Stats
        getPTDashboardStats(ptId),
      ]);

    return res.json({
      success: true,
      ptProfile,
      clinics, // NEW - Add populated clinics
      appointments,
      forumPosts,
      promotion,
      stats,
      lastFetched: new Date(),
    });

  } catch (err) {
    console.error("PT Dashboard data fetch error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch PT dashboard data" 
    });
  }
};

// Helper function to get PT dashboard stats
async function getPTDashboardStats(ptId) {
  try {
    const [
      totalAppointments,
      pendingRequests,
      totalForumPosts,
      activePromotion
    ] = await Promise.all([
      // Total appointments
      Appointment.countDocuments({ pt: ptId }),

      // Pending appointment requests
      Appointment.countDocuments({ 
        pt: ptId, 
        status: "pending" 
      }),

      // Total forum posts
      Post.countDocuments({ createdBy: ptId }),

      // Active promotion for days left calculation
      Promotion.findOne({ 
        pt: ptId,
        status: "active",
        endAt: { $gt: new Date() }
      }).sort({ endAt: 1 })
    ]);

    // Calculate promotion days left
    let promotionDaysLeft = 0;
    if (activePromotion && activePromotion.endAt) {
      const today = new Date();
      const endDate = new Date(activePromotion.endAt);
      promotionDaysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      promotionDaysLeft = Math.max(0, promotionDaysLeft);
    }

    return {
      totalAppointments,
      pendingRequests,
      totalForumPosts,
      promotionDaysLeft,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error("Error getting PT dashboard stats:", error);
    return {
      totalAppointments: 0,
      pendingRequests: 0,
      totalForumPosts: 0,
      promotionDaysLeft: 0,
      lastUpdated: new Date(),
      error: "Failed to load some stats"
    };
  }
}
