import { ENV } from "./env.js";

// --- Structured configuration derived from validated ENV ---
// env.js is the single source of truth for env validation/loading.
export default {
  // Server
  port: ENV.PORT || 4000,
  env: ENV.NODE_ENV || "development",

  // Database
  mongoUri: ENV.MONGO_URI,

  // JWT
  jwt: {
    accessSecret: ENV.JWT_ACCESS_SECRET,
    refreshSecret: ENV.JWT_REFRESH_SECRET,
    accessExpiresIn: ENV.ACCESS_TOKEN_EXPIRES_IN,
    refreshExpiresIn: ENV.REFRESH_TOKEN_EXPIRES_IN,
    // When an access token has less than this many seconds remaining,
    // the server may issue a refreshed access token on activity (sliding session).
    // Default: 300 seconds (5 minutes)
    renewThresholdSeconds: process.env.ACCESS_TOKEN_RENEW_THRESHOLD_SECONDS,
  },

  // Stripe
  stripe: {
    secretKey: ENV.STRIPE_SECRET_KEY,
    webhookSecret: ENV.STRIPE_WEBHOOK_SECRET,
  },

  //Resend
  resendApiKey: ENV.RESEND_API_KEY,

  // Mail (SMTP)
  mailHost: ENV.MAIL_HOST,
  mailPort: ENV.MAIL_PORT,
  mailUser: ENV.MAIL_USER,
  mailPass: ENV.MAIL_PASS,

  // Cloudinary
  cloudinaryUrl: ENV.CLOUDINARY_URL,
  cloudinaryCloudName: ENV.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: ENV.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: ENV.CLOUDINARY_API_SECRET,

  // Cloudflare R2 (Education Resources storage)
  r2: {
    accountId: ENV.R2_ACCOUNT_ID,
    accessKeyId: ENV.R2_ACCESS_KEY_ID,
    secretAccessKey: ENV.R2_SECRET_ACCESS_KEY,
    bucketName: ENV.R2_BUCKET_NAME,
    endpoint: ENV.R2_ENDPOINT,
    region: ENV.R2_REGION || "auto",
  },

  // Education Resources
  education: {
    maxFileSizeMb: parseInt(ENV.EDUCATION_MAX_FILE_SIZE_MB, 10) || 15,
    downloadUrlTtlSeconds:
      parseInt(ENV.EDUCATION_DOWNLOAD_URL_TTL_SECONDS, 10) || 300,
    defaultPageSize: parseInt(ENV.EDUCATION_DEFAULT_PAGE_SIZE, 10) || 20,
    maxPageSize: parseInt(ENV.EDUCATION_MAX_PAGE_SIZE, 10) || 50,
  },

  // Upload Directory
  uploadDir: ENV.UPLOAD_DIR || "uploads/",

  // Frontend / CORS
  clientUrl: ENV.CLIENT_URL,

  // Socket.io
  socketPort: ENV.SOCKET_PORT || 4000,

  // Frontend URLs (for Vite)
  vite: {
    apiUrl: ENV.VITE_API_URL || "http://localhost:4000/api",
    socketUrl: ENV.VITE_SOCKET_URL || "http://localhost:4000",
    appName: ENV.VITE_APP_NAME || "FizioMidia",
  },

  // Logging / Debugging
  debug: ENV.DEBUG_MODE === "true",

  // Production Settings
  productionClientUrl: ENV.PRODUCTION_CLIENT_URL || null,

  // AI (Gemini) — optional, AI disabled when no API key
  gemini: {
    apiKey: ENV.GEMINI_API_KEY || null,
    defaultModel: ENV.GEMINI_MODEL_DEFAULT || "gemini-flash-latest",
    enabled: Boolean(ENV.GEMINI_API_KEY),
  },
};

// --- Optional Logging (credentials masked) ---
if (ENV.DEBUG_MODE === "true" && ENV.NODE_ENV === "development") {
  console.log("✅ Environment variables loaded successfully:");
  console.table({
    PORT: ENV.PORT,
    NODE_ENV: ENV.NODE_ENV,
    MONGO_URI: ENV.MONGO_URI
      ? ENV.MONGO_URI.replace(/\/\/[^@]+@/, "//***:***@")
      : undefined,
    CLIENT_URL: ENV.CLIENT_URL,
    SERVER_URL: process.env.SERVER_URL,
  });
}
