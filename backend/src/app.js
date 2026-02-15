import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import cron from "node-cron";
import { fileURLToPath } from "url";

import { ENV } from "./config/env.js";
import ForumSub from "./models/ForumSub.js";
import { expireSponsoredProductsJob } from "./cron/expiredSponsoredProducts.js";
import { errorHandler } from "./middlewares/errorHandler.js";

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
const __dirname = path.dirname(__filename);

const app = express();

/* ---------------------------------- */
/* Allowed Origins (API only)          */
/* ---------------------------------- */
const allowedOrigins = [
  "http://localhost:5173",
  "http://fiziomidia.org",
  "https://fiziomidia.org",
  "https://www.fiziomidia.org",
  "https://api.fiziomidia.org",
  "https://fiziomidia.netlify.app",
  "https://fiziomidia.pages.dev",
];

/* ---------------------------------- */
/* Global Middleware (API)             */
/* ---------------------------------- */
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // Postman, curl
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(ENV.debug ? "dev" : "combined"));

/* ---------------------------------- */
/* Static Uploads                      */
/* ---------------------------------- */
const uploadsDir = path.join(__dirname, "..", "uploads");

app.use(
  "/uploads",
  express.static(uploadsDir, {
    maxAge: "7d",
    immutable: true,
    setHeaders(res) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

/* ---------------------------------- */
/* Cron Jobs                           */
/* ---------------------------------- */
cron.schedule("0 0 * * *", async () => {
  console.log("🕓 Running daily sponsorship cleanup...");
  await ForumSub.cleanExpiredSponsorships();
});

expireSponsoredProductsJob();

/* ---------------------------------- */
/* Socket.IO Attachment                */
/* ---------------------------------- */
app.use((req, res, next) => {
  const io = req.app.get("io");
  if (io) req.io = io;
  next();
});

/* ---------------------------------- */
/* Serve logo file                     */
/* ---------------------------------- */
app.get("/api/logo", (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=86400"); // 24h
  res.sendFile(path.join(process.cwd(), "public", "fiziomidia_logo_trans.png"));
});

/* ---------------------------------- */
/* API Routes                          */
/* ---------------------------------- */
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

/* ---------------------------------- */
/* Health Check                        */
/* ---------------------------------- */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, env: ENV.env });
});

/* ---------------------------------- */
/* Error Handler                       */
/* ---------------------------------- */
app.use(errorHandler);

export default app;
