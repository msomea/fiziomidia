import { redisClient } from "../../config/redis.js";
import AIConfiguration from "../../models/AIConfiguration.js";

/*
Daily request caps per agent — keeps usage under Gemini free-tier limits.
Primary store: Redis counters ai:usage:{YYYY-MM-DD}:{agent} (TTL 48h).
Fallback: in-memory Map (single-instance dev only).

Caps are resolved from AIConfiguration.agents[].dailyRequestCap,
falling back to built-in defaults matching verified free-tier RPD.
*/

// Built-in defaults — conservative caps below verified free-tier RPD
const DEFAULT_CAPS = {
  physiotherapy: 400, // gemini-3.5-flash-lite: 500 RPD → 80% headroom
  forumContent: 15, // gemini-3.5-flash: 20 RPD → 75% headroom
  virtualAdmin: 400,
};

const memoryCounters = new Map(); // fallback when Redis unavailable

// Local server date (YYYY-MM-DD) — "today" should match the admin's day,
// not UTC midnight (EAT is UTC+3, so UTC rollover happens at 3am local).
const todayKey = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const redisKey = (agent) => `ai:usage:${todayKey()}:${agent}`;

const memoryKey = (agent) => `${todayKey()}:${agent}`;

const isRedisReady = () => redisClient && redisClient.isOpen;

/**
 * Resolve the effective daily cap for an agent.
 * Order: AIConfiguration override → built-in default.
 */
export const getDailyCap = async (agent) => {
  try {
    const config = await AIConfiguration.findOne().lean();
    const agentCfg = config?.agents?.find((a) => a.name === agent);
    if (agentCfg?.dailyRequestCap && agentCfg.dailyRequestCap > 0) {
      return agentCfg.dailyRequestCap;
    }
  } catch {
    // DB unavailable — fall through to defaults
  }
  return DEFAULT_CAPS[agent] ?? 100;
};

/**
 * Get current usage count for an agent today.
 */
export const getUsage = async (agent) => {
  if (isRedisReady()) {
    try {
      const val = await redisClient.get(redisKey(agent));
      return val ? parseInt(val, 10) : 0;
    } catch {
      // fall through to memory
    }
  }
  return memoryCounters.get(memoryKey(agent)) || 0;
};

/**
 * Atomically increment usage and report whether the cap was exceeded.
 * @returns {Promise<{allowed:boolean, used:number, cap:number}>}
 */
export const consumeQuota = async (agent) => {
  const cap = await getDailyCap(agent);
  const used = await getUsage(agent);

  if (used >= cap) {
    return { allowed: false, used, cap };
  }

  if (isRedisReady()) {
    try {
      const key = redisKey(agent);
      const newVal = await redisClient.incr(key);
      if (newVal === 1) {
        // Expire at end of tomorrow UTC to cover timezone edge cases
        await redisClient.expire(key, 60 * 60 * 48);
      }
      return { allowed: true, used: newVal, cap };
    } catch {
      // fall through to memory
    }
  }

  const mKey = memoryKey(agent);
  const newVal = (memoryCounters.get(mKey) || 0) + 1;
  memoryCounters.set(mKey, newVal);
  return { allowed: true, used: newVal, cap };
};

/**
 * Usage snapshot for all agents — for admin dashboard.
 */
export const getAllUsage = async () => {
  const agents = Object.keys(DEFAULT_CAPS);
  const result = {};
  for (const agent of agents) {
    const cap = await getDailyCap(agent);
    const used = await getUsage(agent);
    result[agent] = { used, cap, remaining: Math.max(0, cap - used) };
  }
  return result;
};
