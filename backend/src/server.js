import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { ENV } from "./config/env.js";
import { Server } from "socket.io";

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    const io = initSocket(server);
    app.set("io", io);

    // Start server
    console.log("🔧 Backend server config - ENV.PORT:", ENV.PORT);
    server.listen(ENV.PORT, () => {
      console.log(
        `🚀 Server running in ${ENV.NODE_ENV} mode at PORT ${ENV.PORT}`
      );
      console.log(`🔌 Socket.IO listen setup at http://0.0.0.0:${ENV.PORT}`);
      if (ENV.debug) console.log("✅ Socket.io initialized");
    });
  } catch (err) {
    console.error("❌ Server start failed:", err.message);
    process.exit(1);
  }
};

// Start the server
startServer();
