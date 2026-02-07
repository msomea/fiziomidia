import ForumSub from "../models/ForumSub.js";
import ForumSubModRequest from "../models/ForumSubModRequest.js";

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

    res.json({ requests });
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
export const updateModRequestRole = async (req, res) => {
  try {
    const { id } = req.params; // make sure frontend sends the request ID
    const { role } = req.body;

    const request = await ForumSubModRequest.findById(id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    // update role
    request.role = role;

    // auto-approve if role changed
    if (role === "mod" || role === "sub-mod") {
      request.status = "approved";
      request.reviewedBy = req.user._id;
      request.reviewedAt = new Date();

      // also update the sub moderators array if promoting to mod/sub-mod
      const sub = await ForumSub.findById(request.sub);
      if (sub && !sub.moderators.includes(request.user)) {
        sub.moderators.push(request.user);
        await sub.save();
      }
    }

    await request.save();

    res.json({ success: true, request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update request role" });
  }
};

// ------------------------------------
// APPROVE MODERATOR REQUEST
// ------------------------------------
export const approveModRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ForumSubModRequest.findById(id);
    if (!request || request.status !== "pending") {
      return res.status(404).json({ error: "Request not found or processed" });
    }

    const sub = await ForumSub.findById(request.sub);
    if (!sub) {
      return res.status(404).json({ error: "Forum sub not found" });
    }

    if (!sub.moderators.includes(request.user)) {
      sub.moderators.push(request.user);
      await sub.save();
    }

    request.status = "approved";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.role = "sub-mod"; // default role on approval
    await request.save();

    res.json({ message: "Moderator request approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to approve request" });
  }
};

// ------------------------------------
// REJECT MODERATOR REQUEST
// ------------------------------------
export const rejectModRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await ForumSubModRequest.findById(id);
    if (!request || request.status !== "pending") {
      return res.status(404).json({ error: "Request not found or processed" });
    }

    request.status = "rejected";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    res.json({ message: "Moderator request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reject request" });
  }
};
