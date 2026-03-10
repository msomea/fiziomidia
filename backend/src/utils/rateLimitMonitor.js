import { redisClient } from "../config/redis.js";

// Get rate limit statistics for monitoring
export const getRateLimitStats = async () => {
  try {
    const keys = await redisClient.keys("rl:*");
    const stats = {
      totalKeys: keys.length,
      limiters: {},
    };

    // Group by limiter type
    for (const key of keys) {
      const parts = key.split(":");
      const limiterType = parts[1] || "unknown";
      
      if (!stats.limiters[limiterType]) {
        stats.limiters[limiterType] = {
          count: 0,
          keys: [],
        };
      }
      
      stats.limiters[limiterType].count++;
      stats.limiters[limiterType].keys.push(key);
    }

    return stats;
  } catch (error) {
    console.error("Error getting rate limit stats:", error);
    return { totalKeys: 0, limiters: {} };
  }
};

// Clear rate limit data for a specific key or all keys
export const clearRateLimitData = async (pattern = "rl:*") => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🧹 Cleared ${keys.length} rate limit keys matching pattern: ${pattern}`);
    }
    return keys.length;
  } catch (error) {
    console.error("Error clearing rate limit data:", error);
    return 0;
  }
};

// Get rate limit info for a specific identifier
export const getRateLimitInfo = async (identifier, limiterPrefix = "rl:") => {
  try {
    const key = `${limiterPrefix}${identifier}`;
    const ttl = await redisClient.ttl(key);
    const value = await redisClient.get(key);
    
    return {
      key,
      ttl: ttl > 0 ? ttl : null,
      value: value ? JSON.parse(value) : null,
      exists: ttl > 0,
    };
  } catch (error) {
    console.error("Error getting rate limit info:", error);
    return null;
  }
};

// Middleware to add rate limit headers for debugging
export const addRateLimitHeaders = (req, res, next) => {
  res.on("finish", async () => {
    if (res.statusCode === 429) {
      const identifier = req.headers["cf-connecting-ip"] || 
                       req.headers["x-forwarded-for"]?.split(",")[0].trim() || 
                       req.ip;
      const info = await getRateLimitInfo(`general:${identifier}`);
      
      console.log(`🚫 Rate limit hit for ${identifier}:`, {
        statusCode: res.statusCode,
        limitInfo: info,
        userAgent: req.headers["user-agent"],
        path: req.path,
      });
    }
  });
  next();
};

export default {
  getRateLimitStats,
  clearRateLimitData,
  getRateLimitInfo,
  addRateLimitHeaders,
};
