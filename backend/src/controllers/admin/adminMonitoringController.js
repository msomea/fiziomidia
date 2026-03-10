import AdminActivityLog from "../../models/AdminActivityLog.js";

// -----------------------------------------
// ADMIN MONITORING CONTROLLER
// -----------------------------------------

export const getAdminActivityLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      admin: adminId,
      action,
      targetType,
      startDate,
      endDate,
    } = req.query;

    // Build query
    const query = {};

    // Filter by admin
    if (adminId) {
      query.admin = adminId;
    }

    // Filter by action type
    if (action) {
      query.action = action;
    }

    // Filter by target type
    if (targetType) {
      query.targetType = targetType;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      AdminActivityLog.find(query)
        .populate("admin", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AdminActivityLog.countDocuments(query),
    ]);

    return res.json({
      success: true,
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Get admin activity logs error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch activity logs" });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get activity stats by action type
    const actionStats = await AdminActivityLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get activity stats by admin
    const adminStats = await AdminActivityLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: "$admin", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "adminInfo",
        },
      },
      { $unwind: "$adminInfo" },
      {
        $project: {
          adminName: "$adminInfo.fullName",
          adminEmail: "$adminInfo.email",
          count: 1,
        },
      },
    ]);

    // Get daily activity trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await AdminActivityLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    return res.json({
      success: true,
      stats: {
        actionStats,
        adminStats,
        dailyStats,
      },
    });
  } catch (err) {
    console.error("Get admin stats error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch admin stats" });
  }
};
