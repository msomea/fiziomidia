// controllers/modReqController.js
import ForumSub from "../models/ForumSub.js";
import ForumSubModRequest from "../models/ForumSubModRequest.js";
import { CacheService } from "../utils/redis.js";

// List all requests for a specific sub
export const listModRequestsBySub = async (req, res) => {
  try {
    const { subId } = req.params;
    const { status = "pending" } = req.query; // 👈 NEW

    // validate status
    const allowedStatuses = ["pending", "approved", "rejected"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status filter" });
    }

    // find sub
    const sub = await ForumSub.findById(subId);
    if (!sub) {
      return res.status(404).json({ error: "Sub not found" });
    }

    const userId = req.user._id;
    const userRole = req.user.role;

    // permission check
    const isOwner = sub.createdBy.equals(userId);
    const isMod = sub.moderators.some(
      (m) => m.user.equals(userId) && m.role === "mod"
    );

    if (!isOwner && !isMod && userRole !== "admin") {
      return res.status(403).json({ error: "Permission denied" });
    }

    // build filter dynamically
    const filter = {
      sub: subId,
      status,
    };

    const requests = await ForumSubModRequest.find(filter)
      .populate("user", "fullName email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      status,
      requests,
    });
  } catch (err) {
    console.error("listModRequestsBySub error:", err);
    res.status(500).json({ error: "Failed to fetch mod requests" });
  }
};


// Check if current user is already a mod or has pending request
export const checkMyModStatus = async (req, res) => {
  try {
    const subId = req.params.subId;
    const userId = req.user._id;

    const sub = await ForumSub.findById(subId);
    if (!sub) {
      return res.status(404).json({ error: "Sub not found" });
    }

    // Check if user is the owner
    if (sub.createdBy.equals(userId)) {
      return res.json({
        requested: true,
        alreadyMod: true,
        isOwner: true,
        role: "owner",
      });
    }

    // ✅ role-aware moderator check
    const modEntry = sub.moderators.find((m) => m.user.equals(userId));

    if (modEntry) {
      return res.json({
        requested: true,
        alreadyMod: true,
        isOwner: false,
        role: modEntry.role, // "mod" | "sub_mod"
      });
    }

    // check for existing request (pending or rejected)
    const request = await ForumSubModRequest.findOne({
      sub: subId,
      user: userId,
      status: { $in: ["pending", "rejected"] },
    });

    res.json({
      requested: !!request,
      alreadyMod: false,
      requestStatus: request?.status || null, // frontend can use to show "Request Sent" or "Rejected"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to check mod request status",
    });
  }
};



// Request to become sub moderator
export const createModRequest = async (req, res) => {
  try {
    const subId = req.params.subId;
    const userId = req.user._id;

    const sub = await ForumSub.findById(subId);
    if (!sub)
      return res.status(404).json({ success: false, error: "Sub not found" });

    // Only verified PT can request
    if (req.user.role !== "physiotherapist") {
      return res.status(403).json({
        success: false,
        error: "Only verified PTs can request to be a moderator",
      });
    }

    // Check if user is the owner
    if (sub.createdBy.equals(userId)) {
      return res
        .status(400)
        .json({ success: false, error: "You are the owner of this subforum" });
    }

    // Check if already a mod
    const isMod = sub.moderators.some((m) => m.user.equals(userId));
    if (isMod)
      return res
        .status(400)
        .json({ success: false, error: "You are already a moderator" });

    // Check for existing pending request
    const existingRequest = await ForumSubModRequest.findOne({
      sub: subId,
      user: userId,
      status: "pending",
    });

    if (existingRequest)
      return res
        .status(400)
        .json({ success: false, error: "You already have a pending request" });

    const newRequest = await ForumSubModRequest.create({
      sub: subId,
      user: userId,
      status: "pending",
    });

    // Invalidate admin dashboard cache due to new moderator request
    await CacheService.delPattern(`dashboard:admin:*`);
    console.log(
      `🗑️ Admin dashboard cache invalidated due to new moderator request`,
    );

    res.json({ success: true, request: newRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to create mod request" });
  }
};
