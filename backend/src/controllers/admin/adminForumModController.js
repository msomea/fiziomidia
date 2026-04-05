import ForumSub from "../../models/ForumSub.js";
import ForumSubModRequest from "../../models/ForumSubModRequest.js";
import { CacheService } from "../../utils/redis.js";
import {
  logAdminActivity,
  getModRequestTargetInfo,
} from "../../middlewares/adminActivityLogger.js";

// ------------------------------------
// LIST ALL MODERATOR REQUESTS
// ------------------------------------
export const listModRequests = async (req, res) => {
  try {
    const statusFilter = req.query.status; // "pending", "approved", "rejected"
    const search = req.query.search || "";

    const query = {};
    if (statusFilter) query.status = statusFilter;
    if (search) {
      query.$or = [
        { "user.fullName": { $regex: search, $options: "i" } },
        { "user.email": { $regex: search, $options: "i" } },
        { "sub.title": { $regex: search, $options: "i" } },
      ];
    }

    const requests = await ForumSubModRequest.find(query)
      .populate("user", "fullName email role")
      .populate("sub", "title slug")
      .sort({ createdAt: -1 });

    res.json({ modRequests: requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch moderator requests" });
  }
};

// ------------------------------------
// GET INDIVIDUAL MODERATOR REQUEST DETAILS
// ------------------------------------
export const getModRequestDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await ForumSubModRequest.findById(id)
      .populate("user", "fullName email role")
      .populate("sub", "title slug moderators createdBy");

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json({ request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch request detail" });
  }
};

// ------------------------------------
// UPDATE MODERATOR REQUEST ROLE / STATUS
// ------------------------------------
export const updateModRequestRole = [
  logAdminActivity("MOD_REQUEST_UPDATED", getModRequestTargetInfo),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // allowed roles only
      if (!["mod", "sub_mod", "member"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const request = await ForumSubModRequest.findById(id);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      const sub = await ForumSub.findById(request.sub);
      if (!sub) {
        return res.status(404).json({ error: "Forum sub not found" });
      }

      // find moderator entry (if exists)
      const modEntry = sub.moderators.find(
        (m) => m.user && m.user.equals(request.user),
      );

      // If role is member, remove from moderators
      if (role === "member") {
        request.status = "rejected";
        if (modEntry) {
          sub.moderators = sub.moderators.filter(
            (m) => m.user && !m.user.equals(request.user),
          );
          await sub.save();
        }
      } else {
        request.status = "approved";
        if (!modEntry) {
          sub.moderators.push({
            user: request.user,
            role,
            assignedAt: new Date(),
          });
        } else {
          modEntry.role = role;
        }
        await sub.save();
      }

      request.role = role;
      request.reviewedBy = req.user._id;
      request.reviewedAt = new Date();
      await request.save();

      // Invalidate admin dashboard cache due to moderator request update
      await CacheService.delPattern(`dashboard:admin:${req.user._id}*`);
      console.log(
        `🗑️ Admin dashboard cache invalidated for admin: ${req.user._id} due to moderator request update`,
      );

      res.json({
        success: true,
        request,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "Failed to update request role",
      });
    }
  },
];



