import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { PORT } from "./config/env.js";

async function startServer() {
  try {
    await connectDB();

    const server = http.createServer(app);

    // Initialize socket.io
    const io = initSocket(server);
    app.set("io", io);

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Server start failed:", err.message);
    process.exit(1);
  }
}

startServer();
