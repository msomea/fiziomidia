// controllers/modReqController.js
import ForumSub from "../models/ForumSub.js";
import ForumSubModRequest from "../models/ForumSubModRequest.js";

// List all requests for a specific sub
export const listModRequestsBySub = async (req, res) => {
  try {
    const subId = req.params.subId;

    // find sub
    const sub = await ForumSub.findById(subId);
    if (!sub) return res.status(404).json({ error: "Sub not found" });

    const userId = req.user._id;
    const userRole = req.user.role;

    // check permission
    const isOwner = sub.createdBy.equals(userId);
    const isMod = sub.moderators.some((m) => m.user.equals(userId) && m.role === "mod");

    if (!isOwner && !isMod && userRole !== "admin") {
      return res.status(403).json({ error: "Permission denied" });
    }

    const requests = await ForumSubModRequest.find({ sub: subId, status: "pending" })
      .populate("user", "fullName email role");

    res.json({ requests });
  } catch (err) {
    console.error(err);
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

    // ✅ role-aware moderator check
    const modEntry = sub.moderators.find((m) => m.user.equals(userId));

    if (modEntry) {
      return res.json({
        requested: true,
        alreadyMod: true,
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
    if (!sub) return res.status(404).json({ success: false, error: "Sub not found" });

    // Only verified PT can request
    if (req.user.role !== "physiotherapist") {
      return res.status(403).json({ success: false, error: "Only verified PTs can request to be a moderator" });
    }

    // Check if already a mod
    const isMod = sub.moderators.some((m) => m.equals(userId));
    if (isMod) return res.status(400).json({ success: false, error: "You are already a moderator" });

    // Check for existing pending request
    const existingRequest = await ForumSubModRequest.findOne({
      sub: subId,
      user: userId,
      status: "pending",
    });

    if (existingRequest) return res.status(400).json({ success: false, error: "You already have a pending request" });

    const newRequest = await ForumSubModRequest.create({
      sub: subId,
      user: userId,
      status: "pending",
    });

    res.json({ success: true, request: newRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to create mod request" });
  }
};
