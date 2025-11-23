import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path"
import { ENV } from "./config/env.js";
import config from "./config/index.js";
import ForumSub from "./models/ForumSub.js";
import cron from "node-cron";
import { fileURLToPath } from "url";

// Schedule a cron job to clean expired sponsorships daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("🕓 Running daily sponsorship cleanup...");
  await ForumSub.cleanExpiredSponsorships();
});

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import ptRoutes from "./routes/pts.js";
import appointmentRoutes from "./routes/appointments.js";
import forumRoutes from "./routes/forum.js";
import promotionRoutes from "./routes/promotions.js";
import messageRoutes from "./routes/message.js";
import adminRoutes from "./routes/admin.js";
import locationRoutes from "./routes/location.js";

const __filename = fileURLToPath(import.meta.url);
// __dirname should point to the directory of this file (backend/src)
const __dirname = path.dirname(__filename);

// Middleware
import { errorHandler } from "./middlewares/errorHandler.js";
import fs from "fs";

// Initialize Express
const app = express();

// --- Middleware ---
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(ENV.debug ? "dev" : "combined"));
// app.use("/uploads", express.static("uploads"));
// Serve uploads folder (resolve relative to backend root)
const uploadsDir = path.join(__dirname, "..", config.uploadDir || "uploads");

// Ensure CORS headers for uploads responses so files served here are
// accessible from the frontend (which may run on a different origin).
app.use((req, res, next) => {
  // Only add CORS headers for requests to /uploads
  if (
    req.path.startsWith("/uploads") ||
    req.originalUrl.startsWith("/uploads")
  ) {
    res.header("Access-Control-Allow-Origin", ENV.CLIENT_URL || "*");
    res.header("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    // If browsers send OPTIONS preflight, respond immediately
    if (req.method === "OPTIONS") return res.sendStatus(200);
  }
  next();
});

app.use("/uploads", express.static(uploadsDir));

// Backwards-compatibility: some files were previously written to
// `backend/src/services/uploads` (when uploadService used __dirname
// directly). If a file isn't found in the main uploads folder, allow
// Express to try the legacy location as a fallback so existing files
// remain accessible.
const legacyUploadsDir = path.join(__dirname, "services", "uploads");
app.use("/uploads", express.static(legacyUploadsDir));

// --- Routes ---
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pts", ptRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/locations", locationRoutes);

// --- Health check ---
app.get("/health", (req, res) => {
  res.json({ ok: true, env: ENV.env });
});

// --- Error handler ---
app.use(errorHandler);

export default app;
