import ForumSub from "../models/ForumSub.js";

export const isSubModerator = async (req, res, next) => {
  try {
    const subId = req.params.subId || req.params.id;

    const sub = await ForumSub.findById(subId);
    if (!sub) {
      return res.status(404).json({ error: "Forum sub not found" });
    }

    const isAdmin = req.user.role === "admin";
    const isModerator = sub.moderators.some(
      (modId) => modId.toString() === req.user._id.toString()
    );

    if (!isAdmin && !isModerator) {
      return res.status(403).json({
        error: "Moderator or admin access required",
      });
    }

    req.sub = sub;
    next();
  } catch (err) {
    console.error("Sub moderator check failed:", err);
    res.status(500).json({ error: "Authorization error" });
  }
};
