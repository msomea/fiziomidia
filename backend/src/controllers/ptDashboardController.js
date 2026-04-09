import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Post from "../models/Post.js";
import PTPromotion from "../models/PTPromotion.js";
import Clinic from "../models/Clinic.js";
import ClinicPromotion from "../models/ClinicPromotion.js";
import asyncHandler from "express-async-handler";
import dayjs from "dayjs";
import {
  getClinicAppointmentsForPT,
  getClinicPromotionsForPT,
  getPTRequestsForPT,
  getUserNotifications,
  getMyForumSubs,
} from "../services/clinicService.js";

// ============================================
// CONSOLIDATED PT DASHBOARD API
// ============================================
export const getPTDashboardData = async (req, res) => {
  try {
    const { id: ptId } = req.params;
    const { limit = 3 } = req.query;

    const [
      ptProfile,
      clinics,
      appointments,
      forumPosts,
      promotion,
      stats,
      clinicAppointments,
      clinicPromotions,
      ptRequests,
      notifications,
      forumSubs,
    ] = await Promise.all([
      // PT Profile
      User.findById(ptId).select("-passwordHash -refreshTokens"),

      // Clinics
      Clinic.find({ ownerUserId: ptId })
        .populate("ownerUserId", "fullName email phone")
        .populate("physiotherapists", "fullName email phone"),

      // Appointments
      Appointment.find({ pt: ptId })
        .populate("requester", "fullName email phone")
        .populate("clinic", "name location address")
        .sort({ appointmentDate: 1 })
        .limit(parseInt(limit)),

      // Forum Posts
      Post.find({ createdBy: ptId })
        .populate("sub", "title slug")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit)),

      // Latest promotion (any status)
      PTPromotion.findOne({ pt: ptId }).sort({ createdAt: -1 }),

      // Stats
      getPTDashboardStats(ptId),

      // Clinic Appointments for PT's owned clinics
      getClinicAppointmentsForPT(ptId),

      // Clinic Promotions for PT's owned clinics
      getClinicPromotionsForPT(ptId),

      // PT Requests (Invitations) for PT
      getPTRequestsForPT(ptId),

      // User Notifications
      getUserNotifications(ptId),

      // Forum Subscriptions
      getMyForumSubs(ptId),
    ]);

    return res.json({
      success: true,
      ptProfile,
      clinics,
      appointments,
      forumPosts,
      promotion,
      stats,
      clinicAppointments,
      clinicPromotions,
      ptRequests,
      notifications,
      forumSubs,
      lastFetched: new Date(),
    });

  } catch (err) {
    console.error("PT Dashboard data fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch PT dashboard data",
    });
  }
};

// ============================================
// Helper: Dashboard Stats
// ============================================
async function getPTDashboardStats(ptId) {
  try {
    const [
      totalAppointments,
      pendingRequests,
      totalForumPosts,
      activePromotion,
    ] = await Promise.all([
      // Total appointments
      Appointment.countDocuments({ pt: ptId }),

      // Pending appointments
      Appointment.countDocuments({
        pt: ptId,
        status: "pending",
      }),

      // Forum posts
      Post.countDocuments({ author: ptId }),

      // Active promotion
      PTPromotion.findOne({
        pt: ptId,
        status: "active",
        endAt: { $gt: new Date() },
      }).sort({ endAt: 1 }),
    ]);

    // Promotion Days Left using Day.js
    let promotionDaysLeft = 0;

    if (activePromotion?.endAt) {
      const today = dayjs().startOf("day"); // normalize to midnight
      const endDate = dayjs(activePromotion.endAt).startOf("day");

      // Difference in calendar days
      promotionDaysLeft = Math.max(0, endDate.diff(today, "day"));
    }

    return {
      totalAppointments,
      pendingRequests,
      totalForumPosts,
      promotionDaysLeft,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("Error getting PT dashboard stats:", error);

    return {
      totalAppointments: 0,
      pendingRequests: 0,
      totalForumPosts: 0,
      promotionDaysLeft: 0,
      lastUpdated: new Date(),
      error: "Failed to load some stats",
    };
  }
}


export { getPTDashboardStats };
