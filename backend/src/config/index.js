import dotenv from "dotenv";

dotenv.config();

// --- Validate required environment variables ---
const requiredVars = [
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CLOUDINARY_URL",
  "CLIENT_URL",
];

for (const key of requiredVars) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// --- Export configuration object ---
export default {
  // Server
  port: process.env.PORT || 4000,
  env: process.env.NODE_ENV || "development",

  // Database
  mongoUri: process.env.MONGO_URI,

  // JWT
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  // Cloudinary
  cloudinaryUrl: process.env.CLOUDINARY_URL,

  // Upload Directory
  uploadDir: process.env.UPLOAD_DIR || "uploads/",

  // Frontend / CORS
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  // Socket.io
  socketPort: process.env.SOCKET_PORT || 4000,

  // Frontend URLs (for Vite)
  vite: {
    apiUrl: process.env.VITE_API_URL || "http://localhost:4000/api",
    socketUrl: process.env.VITE_SOCKET_URL || "http://localhost:4000",
    appName: process.env.VITE_APP_NAME || "Fiziomidia",
  },

  // Logging / Debugging
  debug: process.env.DEBUG_MODE === "true",

  // Production Settings
  productionClientUrl: process.env.PRODUCTION_CLIENT_URL || null,
};

// --- Optional Logging ---
if (process.env.DEBUG_MODE === "true" && process.env.NODE_ENV === "development") {
  console.log("✅ Environment variables loaded successfully:");
  console.table({
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    MONGO_URI: process.env.MONGO_URI,
    CLIENT_URL: process.env.CLIENT_URL,
    SERVER_URL: process.env.SERVER_URL,
  });
}
