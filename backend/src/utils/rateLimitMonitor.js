import { redisClient } from "../config/redis.js";

/*
========================================
SCAN UTILITY (Safe alternative to KEYS)
========================================
*/
const scanKeys = async (pattern) => {
  let cursor = 0;
  const keys = [];

  try {
    do {
      const result = await redisClient.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });

      cursor = result.cursor;
      keys.push(...result.keys);

    } while (cursor !== 0);

    return keys;
  } catch (error) {
    console.error("Error scanning Redis keys:", error);
    return [];
  }
};

/*
========================================
GET RATE LIMIT STATISTICS
========================================
*/
export const getRateLimitStats = async () => {
  if (!redisClient?.isOpen) {
    return { totalKeys: 0, limiters: {} };
  }

  try {
    const keys = await scanKeys("rl:*");

    const stats = {
      totalKeys: keys.length,
      limiters: {},
    };

    for (const key of keys) {
      const parts = key.split(":");
      const limiterType = parts[1] || "unknown";

      if (!stats.limiters[limiterType]) {
        stats.limiters[limiterType] = {
          count: 0,
        };
      }

      stats.limiters[limiterType].count++;
    }

    return stats;

  } catch (error) {
    console.error("Error getting rate limit stats:", error);
    return { totalKeys: 0, limiters: {} };
  }
};

/*
========================================
CLEAR RATE LIMIT DATA
========================================
*/
export const clearRateLimitData = async (pattern = "rl:*") => {
  if (!redisClient?.isOpen) return 0;

  try {
    const keys = await scanKeys(pattern);

    for (let i = 0; i < keys.length; i += 100) {
      const batch = keys.slice(i, i + 100);
      await redisClient.del(batch);
    }

    console.log(`🧹 Cleared ${keys.length} rate limit keys (${pattern})`);

    return keys.length;

  } catch (error) {
    console.error("Error clearing rate limit data:", error);
    return 0;
  }
};

/*
========================================
GET INFO FOR SPECIFIC RATE LIMIT KEY
========================================
*/
export const getRateLimitInfo = async (
  identifier,
  limiterPrefix = "rl:"
) => {
  if (!redisClient?.isOpen) return null;

  try {
    const key = `${limiterPrefix}${identifier}`;

    const ttl = await redisClient.ttl(key);
    const value = await redisClient.get(key);

    return {
      key,
      ttl: ttl > 0 ? ttl : null,
      hits: value ? Number(value) : 0,
      exists: ttl > 0,
    };

  } catch (error) {
    console.error("Error getting rate limit info:", error);
    return null;
  }
};

/*
========================================
DEBUG MIDDLEWARE
Logs when a rate limit is triggered
========================================
*/
export const addRateLimitHeaders = (req, res, next) => {

  res.on("finish", () => {

    if (res.statusCode === 429) {

      const identifier =
        req.headers["cf-connecting-ip"] ||
        req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
        req.ip;

      console.warn("🚫 Rate limit triggered", {
        ip: identifier,
        path: req.path,
        userAgent: req.headers["user-agent"],
        method: req.method,
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