import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path"
import { ENV } from "./config/env.js";
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
import adminRoutes from "./routes/admin.js"
import locationRoutes from "./routes/location.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = process.cwd();

// Middleware
import { errorHandler } from "./middlewares/errorHandler.js";

// Initialize Express
const app = express();

// --- Middleware ---
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(ENV.debug ? "dev" : "combined"));
// app.use("/uploads", express.static("uploads"));
// Serve uploads folder
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

console.log("📁 Serving uploads from:", path.join(__dirname, "uploads"));


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
