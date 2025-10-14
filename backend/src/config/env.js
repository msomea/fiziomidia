import dotenv from "dotenv";

dotenv.config();

// Define all required environment variables for validation
const requiredVars = [
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CLOUDINARY_URL",
  "CLIENT_URL",
];

// Validate required environment variables
for (const key of requiredVars) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// Export environment configuration
export const ENV = {
  // Server
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  MONGO_URI: process.env.MONGO_URI,

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

  // Cloudinary
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,

  // File Uploads
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads/",

  // Frontend (CORS)
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  // Socket.io
  SOCKET_PORT: process.env.SOCKET_PORT || 4000,

  // Frontend (Vite)
  VITE_API_URL: process.env.VITE_API_URL || "http://localhost:4000/api",
  VITE_SOCKET_URL: process.env.VITE_SOCKET_URL || "http://localhost:4000",
  VITE_APP_NAME: process.env.VITE_APP_NAME || "Fiziomidia",

  // Logging / Debugging
  DEBUG_MODE: process.env.DEBUG_MODE === "true",

  // Optional Production Settings
  PRODUCTION_CLIENT_URL: process.env.PRODUCTION_CLIENT_URL,
};

