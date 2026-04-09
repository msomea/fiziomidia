import { redisClient } from "../config/redis.js";

// Cache utility functions
export const CacheKeys = {
  USER_PROFILE: (id) => `user:${id}:profile`,
  USER_NOTIFICATIONS: (id) => `user:${id}:notifications`,
  PT_PROFILE: (id) => `pt:${id}:profile`,
  DASHBOARD_ADMIN: (id) => `dashboard:admin:${id}`,
  DASHBOARD_PT: (id) => `dashboard:pt:${id}`,
  DASHBOARD_MEMBER: (id) => `dashboard:member:${id}`,
  FORUM_SUBS: () => `forum:subs:list`,
  FORUM_SUB: (id) => `forum:sub:${id}`,
  FORUM_POSTS: (subId, page = 1) => `forum:sub:${subId}:posts:page:${page}`,
  FORUM_POST: (id) => `forum:post:${id}`,
  FORUM_MANAGEMENT: (subId) => `forum:sub:${subId}:management`,
  PT_PROMOTIONS: () => `home:pt-promotions`,
  CLINIC_PROMOTIONS: () => `home:clinic-promotions`,
  SPONSORED_PRODUCTS: () => `home:sponsored-products`,
};

// Cache TTL (Time To Live) in seconds
export const CacheTTL = {
  SHORT: 5 * 60, // 5 minutes - hot data
  MEDIUM: 30 * 60, // 30 minutes - warm data
  LONG: 2 * 60 * 60, // 2 hours - cool data
  VERY_LONG: 24 * 60 * 60, // 24 hours - static data
  NOTIFICATIONS: 10 * 60, // 10 minutes - notifications
  PROMOTIONS: 15 * 60, // 15 minutes - promotional content
  SPONSORED_PRODUCTS: 20 * 60, // 20 minutes - sponsored products
};

// Cache helper functions
export class CacheService {
  // Get data from cache
  static async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  // Set data in cache with TTL
  static async set(key, data, ttl = CacheTTL.MEDIUM) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  // Delete data from cache
  static async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  }

  // Delete multiple cache keys (pattern matching)
  static async delPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(
          `🗑️ Cache deleted ${keys.length} keys matching pattern: ${pattern}`,
        );
      }
      return keys.length;
    } catch (error) {
      console.error("Cache delete pattern error:", error);
      return 0;
    }
  }

  // Check if key exists
  static async exists(key) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  }

  // Cache middleware factory
  static middleware(keyFn, ttl = CacheTTL.MEDIUM) {
    return async (req, res, next) => {
      try {
        const cacheKey = keyFn(req);
        const cachedData = await this.get(cacheKey);

        if (cachedData) {
          console.log(`🎯 Cache hit: ${cacheKey}`);
          return res.json(cachedData);
        }

        console.log(`💨 Cache miss: ${cacheKey}`);

        // Override res.json to cache the response
        const originalJson = res.json;
        res.json = function (data) {
          // Only cache successful responses
          if (res.statusCode === 200 && data.success !== false) {
            CacheService.set(cacheKey, data, ttl).catch(console.error);
          }
          return originalJson.call(this, data);
        };

        next();
      } catch (error) {
        console.error("Cache middleware error:", error);
        next();
      }
    };
  }

  // Cache warming utility
  static async warmCache(key, dataFn, ttl = CacheTTL.MEDIUM) {
    try {
      const exists = await this.exists(key);
      if (!exists) {
        const data = await dataFn();
        await this.set(key, data, ttl);
        console.log(`🔥 Cache warmed: ${key}`);
        return data;
      }
      return await this.get(key);
    } catch (error) {
      console.error("Cache warm error:", error);
      return null;
    }
  }
}

export default redisClient;
