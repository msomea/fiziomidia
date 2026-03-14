import rateLimit,{ipKeyGenerator} from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "../config/redis.js";

/*
========================================
IP KEY GENERATOR (Cloudflare compatible)
========================================
*/
const getIPKey = (req) => {
  return ipKeyGenerator(req);
};

/*
========================================
USER KEY GENERATOR (Authenticated users)
========================================
*/
const getUserKey = (req) => {
  if (req.user?.id) {
    return `user:${req.user.id}`;
  }

  return `ip:${ipKeyGenerator(req)}`;
};

/*
========================================
REDIS STORE
========================================
*/
const getRedisStore = () => {
  if (!redisClient || !redisClient.isOpen) return undefined;

  return new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: "rl:",
  });
};

/*
========================================
RATE LIMIT FACTORY
========================================
*/
const createLimiter = ({
  windowMs,
  max,
  message,
  code,
  keyGenerator,
}) => {
  return rateLimit({
    windowMs,
    max,

    standardHeaders: true,
    legacyHeaders: false,

    store: getRedisStore(),

    keyGenerator: keyGenerator || getIPKey,

    handler: (req, res) => {
      res.status(429).json({
        success: false,
        type: "RATE_LIMIT",
        code: code || "RATE_LIMIT_GENERAL",
        message:
          message ||
          "Too many requests. Please try again later.",
        retryAfter: res.getHeader("Retry-After"),
      });
    },
  });
};

/*
========================================
PREDEFINED LIMITERS
========================================
*/

export const limiters = {
  /*
  Global API protection
  */
  general: createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 200,
    code: "RATE_LIMIT_GENERAL",
  }),

  /*
  Authentication
  */
  login: createLimiter({
    windowMs: 10 * 60 * 1000,
    max: 5,
    code: "RATE_LIMIT_LOGIN",
    message: "Too many login attempts, please try again later.",
  }),

  register: createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    code: "RATE_LIMIT_REGISTER",
    message:
      "Too many registration attempts, please try again later.",
  }),

  passwordReset: createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 3,
    code: "RATE_LIMIT_RESET",
    message:
      "Too many password reset attempts, please try again later.",
  }),

  /*
  Authenticated user routes
  */
  refreshToken: createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 50,
    keyGenerator: getUserKey,
    code: "RATE_LIMIT_REFRESH",
  }),

  admin: createLimiter({
    windowMs: 60 * 1000,
    max: 100,
    keyGenerator: getUserKey,
    code: "RATE_LIMIT_ADMIN",
  }),

  /*
  Contact form
  */
  contact: createLimiter({
    windowMs: 10 * 60 * 1000,
    max: 2,
    code: "RATE_LIMIT_CONTACT",
    message:
      "Too many contact form submissions, please try again later.",
  }),

  /*
  Messaging
  */
  message: createLimiter({
    windowMs: 5 * 60 * 1000,
    max: 10,
    keyGenerator: getUserKey,
    code: "RATE_LIMIT_MESSAGE",
  }),

  /*
  File uploads
  */
  upload: createLimiter({
    windowMs: 10 * 60 * 1000,
    max: 20,
    keyGenerator: getUserKey,
    code: "RATE_LIMIT_UPLOAD",
  }),

  /*
  Forum
  */
  forumPost: createLimiter({
    windowMs: 10 * 60 * 1000,
    max: 5,
    keyGenerator: getUserKey,
    code: "RATE_LIMIT_FORUM_POST",
  }),

  forumComment: createLimiter({
    windowMs: 5 * 60 * 1000,
    max: 15,
    keyGenerator: getUserKey,
    code: "RATE_LIMIT_FORUM_COMMENT",
  }),
};

export default createLimiter;