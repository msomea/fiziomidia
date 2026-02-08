import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { ENV } from "./config/env.js";
import config from "./config/index.js";
import ForumSub from "./models/ForumSub.js";
import cron from "node-cron";
import { fileURLToPath } from "url";
import { expireSponsoredProductsJob } from "./cron/expiredSponsoredProducts.js";

// Schedule a cron job to clean expired sponsorships daily at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("🕓 Running daily sponsorship cleanup...");
  await ForumSub.cleanExpiredSponsorships();
});
// Clone job to remove expired sponsored product
expireSponsoredProductsJob();

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import ptRoutes from "./routes/pts.js";
import appointmentRoutes from "./routes/appointments.js";
import forumRoutes from "./routes/forum.js";
import promotionRoutes from "./routes/promotions.js";
import messageRoutes from "./routes/message.js";
import conversationRoute from "./routes/conversation.js";
import adminRoutes from "./routes/admin.js";
import locationRoutes from "./routes/location.js";
import sponsoredProduct from "./routes/sponsoredProduct.js";

const __filename = fileURLToPath(import.meta.url);
// __dirname should point to the directory of this file (backend/src)
const __dirname = path.dirname(__filename);

// Middleware
import { errorHandler } from "./middlewares/errorHandler.js";

// Initialize Express
const app = express();

// Allwed Origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://fiziomidia.org",
  "https://fiziomidia.netlify.app",
  "https://fiziomidia.pages.dev",
  "https://fiziomidia.com",
];

// --- Middleware ---
app.use(
  cors({
    origin: function (origin, callback) {
      // allow REST tools (Postman, curl) with no origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(ENV.debug ? "dev" : "combined"));



// Ensure CORS headers for uploads responses so files served here are
// accessible from the frontend (which may run on a different origin).
app.use((req, res, next) => {
  if (req.path.startsWith("/uploads")) {
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    }

    res.header("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
  }
  next();
});

// uploads/main folder
const uploadsDir = path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(uploadsDir));

// legacy fallback
const legacyUploadsDir = path.join(__dirname, "services", "uploads");
app.use("/uploads", express.static(legacyUploadsDir));

// Catch header
// app.use(
//   "/uploads",
//   express.static(uploadsDir, {
//     maxAge: "7d",
//     immutable: true,
//   })
// );

// --- Routes ---
// Attach socket.io instance (set in server.js) to each request so
// controllers can emit events using `req.io`.
app.use((req, res, next) => {
  try {
    const io = req.app.get("io");
    if (io) req.io = io;
  } catch (e) {
    // if not initialized yet, skip attaching
  }
  next();
});

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/pts", ptRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoute);
app.use("/api/locations", locationRoutes);
app.use("/api/sponsored-products", sponsoredProduct);

// --- Health check ---
app.get("/api/health", (req, res) => {
  res.json({ ok: true, env: ENV.env });
});

// --- Error handler ---
app.use(errorHandler);

export default app;
