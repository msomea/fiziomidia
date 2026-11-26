import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { connectRedis } from "./config/redis.js";
import { ENV } from "./config/env.js";


const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Redis
    await connectRedis();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    const io = initSocket(server);
    app.set("io", io);

    // Start server
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${ENV.PORT} is already in use`);
      } else {
        console.error("❌ Server error:", err);
      }
      process.exit(1);
    });

    server.listen(ENV.PORT, () => {
      console.log(
        `▶️  Server running in ${ENV.NODE_ENV} mode at PORT ${ENV.PORT}`,
      );
      if (ENV.debug) console.log("✅ Socket.io initialized");
    });
  } catch (err) {
    console.error("❌ Server start failed:", err.message);
    process.exit(1);
  }
};

// Start the server
startServer();
