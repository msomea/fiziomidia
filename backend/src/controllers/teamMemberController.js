import TeamMember from "../models/TeamMember.js";
import { CacheService, CacheKeys, CacheTTL } from "../utils/redis.js";

export const getTeamMembers = async (req, res) => {
  try {
    const cacheKey = CacheKeys.TEAM_MEMBERS();
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const members = await TeamMember.find({ isActive: true })
      .select("_id name title email bio image sortOrder")
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    const response = {
      success: true,
      members,
    };

    await CacheService.set(cacheKey, response, CacheTTL.SHORT);
    return res.json(response);
  } catch (err) {
    console.error("Failed to fetch team members:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch team members",
    });
  }
};
