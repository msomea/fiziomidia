import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "../config/redis.js";

// IP-based key generator with Cloudflare support
const getIPKey = (req) => {
  const ip = 
    req.headers["cf-connecting-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.ip;
  
  // Use the built-in IP key generator for proper IPv6 handling
  return req.ip || ip;
};

// User-based key generator (for authenticated users)
const getUserKey = (req) => {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }
  return `ip:${getIPKey(req)}`;
};

// Create Redis-based rate limiter factory
const createRedisLimiter = (options) => {
  // Check if Redis is available and connected
  const useRedis = redisClient && redisClient.isOpen;
  
  const limiterOptions = {
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        type: "RATE_LIMIT",
        code: options.code || "RATE_LIMIT_GENERAL",
        message: options.message || "Too many requests, please try again later.",
        retryAfter: res.getHeader("Retry-After"),
      });
    },
    windowMs: options.windowMs,
    max: options.max,
  };
  
  // Only add custom key generator if specified
  if (options.keyGenerator) {
    limiterOptions.keyGenerator = options.keyGenerator;
  }
  
  if (useRedis) {
    console.log("🔴 Using Redis-based rate limiting");
    return rateLimit({
      ...limiterOptions,
      store: new RedisStore({
        client: redisClient,
        prefix: "rl:", // Rate limit prefix
      }),
    });
  } else {
    console.log("🟡 Using memory-based rate limiting (Redis not available)");
    return rateLimit(limiterOptions);
  }
};

// Dynamic limiter factory that checks Redis connection at runtime
const createDynamicLimiter = (options) => {
  return (req, res, next) => {
    const limiter = createRedisLimiter(options);
    return limiter(req, res, next);
  };
};

// Predefined limiters (using dynamic factory)
export const limiters = {
  // Global API limiter
  general: createDynamicLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    code: "RATE_LIMIT_GENERAL",
    message: "Too many requests, please try again later.",
  }),

  // Authentication limiters
  login: createDynamicLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 attempts per window
    code: "RATE_LIMIT_LOGIN",
    message: "Too many login attempts, please try again later.",
  }),

  register: createDynamicLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    code: "RATE_LIMIT_REGISTER",
    message: "Too many registration attempts, please try again later.",
  }),

  passwordReset: createDynamicLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 attempts per window
    code: "RATE_LIMIT_RESET",
    message: "Too many password reset attempts, please try again later.",
  }),

  // Authenticated user limiters (higher limits)
  refreshToken: createDynamicLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per window for authenticated users
    code: "RATE_LIMIT_REFRESH",
    message: "Too many token refresh attempts, please try again later.",
    keyGenerator: getUserKey,
  }),

  // Contact form
  contact: createDynamicLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 2, // 2 requests per window
    code: "RATE_LIMIT_CONTACT",
    message: "Too many contact form submissions, please try again later.",
  }),

  // Message sending
  message: createDynamicLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 messages per window
    code: "RATE_LIMIT_MESSAGE",
    message: "Too many messages sent, please wait before sending more.",
    keyGenerator: getUserKey,
  }),

  // File uploads
  upload: createDynamicLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // 20 uploads per window
    code: "RATE_LIMIT_UPLOAD",
    message: "Too many file uploads, please try again later.",
    keyGenerator: getUserKey,
  }),

  // Forum posts
  forumPost: createDynamicLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // 5 posts per window
    code: "RATE_LIMIT_FORUM_POST",
    message: "Too many forum posts, please wait before posting again.",
    keyGenerator: getUserKey,
  }),

  // Forum comments
  forumComment: createDynamicLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 15, // 15 comments per window
    code: "RATE_LIMIT_FORUM_COMMENT",
    message: "Too many comments, please wait before commenting again.",
    keyGenerator: getUserKey,
  }),
};

export default createRedisLimiter;
