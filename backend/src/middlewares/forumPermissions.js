// middleware/forumPermission.js
import ForumSub from "../models/ForumSub.js";
import { getUserForumRole } from "../utils/forumPermissions.js";

export const requireForumPermission = (allowedRoles = []) => {
  return async (req, res, next) => {
    const subId = req.params.id;
    if (!subId) return res.status(400).json({ error: "Sub ID required" });

    const sub = await ForumSub.findById(subId);
    if (!sub) return res.status(404).json({ error: "Forum not found" });

    let role = null;
    if (req.user) {
      if (sub.createdBy.equals(req.user._id)) role = "owner";
      else {
        const mod = sub.moderators.find((m) =>
          m.user.equals(req.user._id)
        );
        role = mod ? mod.role : null;
      }
    }

    // Admin-only actions: "delete sub" and "sponsorship"
    const adminOnly = ["delete_sub", "manage_sponsorship"];
    if (
      adminOnly.includes(req.action) &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Admin only" });
    }

    // Check allowed roles for other actions
    if (!role || (!allowedRoles.includes(role) && req.user.role !== "admin")) {
      return res.status(403).json({ error: "Permission denied" });
    }

    req.forumSub = sub;
    req.forumRole = role;
    next();
  };
};

