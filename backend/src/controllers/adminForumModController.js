import ForumSub from "../models/ForumSub.js";
import ForumSubModRequest from "../models/ForumSubModRequest.js";

// ------------------------------------
// LIST ALL MODERATOR REQUESTS
// ------------------------------------
export const listModRequests = async (req, res) => {
  try {
    const requests = await ForumSubModRequest.find()
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

    sub.moderators.push(request.user);
    await sub.save();

    request.status = "approved";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
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
