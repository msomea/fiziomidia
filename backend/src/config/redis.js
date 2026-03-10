import { createClient } from "redis";
import { ENV } from "./env.js";

// Create Redis client for Redis Cloud
const redisClient = createClient({
  username: 'default',
  password: ENV.REDIS_PASSWORD,
  socket: {
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT
  }
});

// Redis event handlers
redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

redisClient.on("connect", () => {
  console.log("✅ Redis Client Connected");
});

redisClient.on("ready", () => {
  console.log("🚀 Redis Client Ready");
});

redisClient.on("end", () => {
  console.log("🔌 Redis Client Disconnected");
});

// Connect to Redis
const connectRedis = async () => {
  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error);
    throw error;
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  try {
    await redisClient.quit();
    console.log("🔌 Redis client closed gracefully");
  } catch (err) {
    console.error("❌ Error closing Redis client:", err);
  }
  process.exit(0);
});

export { redisClient, connectRedis };
