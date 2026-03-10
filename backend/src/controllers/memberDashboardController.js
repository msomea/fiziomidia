import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import asyncHandler from "express-async-handler";

// ============================================
// CONSOLIDATED MEMBER DASHBOARD API
// ============================================
export const getMemberDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;

    // Build all queries in parallel for better performance
    const [
      memberProfile,
      appointments,
      savedPTs,
      stats
    ] = await Promise.all([
      // Member Profile query
      User.findById(userId).select("-passwordHash -refreshTokens"),

      // Appointments query
      Appointment.find({ requester: userId })
        .populate("pt", "fullName specialization ptProfile")
        .populate("clinic", "name location")
        .sort({ scheduledDate: 1 }),

      // Saved PTs query
      User.findById(userId).populate("savedPTs", "fullName profileImageUrl ptProfile"),

      // Dashboard Stats
      getMemberDashboardStats(userId)
    ]);

    // Extract saved PTs from the populated user document
    const savedPTsList = savedPTs?.savedPTs || [];

    return res.json({
      success: true,
      memberProfile,
      appointments,
      savedPTs: savedPTsList,
      stats,
      lastFetched: new Date(),
    });

  } catch (err) {
    console.error("Member Dashboard data fetch error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch member dashboard data" 
    });
  }
};

// Helper function to get member dashboard stats
async function getMemberDashboardStats(userId) {
  try {
    const [
      totalAppointments,
      upcomingAppointments,
      completedAppointments,
      savedPTsCount
    ] = await Promise.all([
      // Total appointments
      Appointment.countDocuments({ requester: userId }),

      // Upcoming appointments (not cancelled or completed)
      Appointment.countDocuments({ 
        requester: userId,
        status: { $in: ["pending", "accepted"] },
        scheduledDate: { $gte: new Date() }
      }),

      // Completed appointments
      Appointment.countDocuments({ 
        requester: userId,
        status: "completed"
      }),

      // Saved PTs count
      User.findById(userId).then(user => user?.savedPTs?.length || 0)
    ]);

    return {
      totalAppointments,
      upcomingAppointments,
      completedAppointments,
      savedPTsCount,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error("Error getting member dashboard stats:", error);
    return {
      totalAppointments: 0,
      upcomingAppointments: 0,
      completedAppointments: 0,
      savedPTsCount: 0,
      lastUpdated: new Date(),
      error: "Failed to load some stats"
    };
  }
}
