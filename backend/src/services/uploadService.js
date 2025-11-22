// uploadService.js
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base uploads folder inside backend
const BASE_UPLOAD_DIR = path.join(__dirname, "uploads");

// Ensure folder exists
if (!fs.existsSync(BASE_UPLOAD_DIR)) fs.mkdirSync(BASE_UPLOAD_DIR, { recursive: true });

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folderName = "others"; // default folder

    if (file.fieldname === "avatar") folderName = "avatars";
    else if (file.fieldname === "licenseDocument") folderName = "licenses";

    const dir = path.join(BASE_UPLOAD_DIR, folderName);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp + original name
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

// File filter to accept only images or pdf
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF or image files are allowed"));
};

// Limits
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

// Export multer instance
const upload = multer({ storage, fileFilter, limits });

export { upload, BASE_UPLOAD_DIR };
