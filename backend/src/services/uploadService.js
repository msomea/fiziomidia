// uploadService.js
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import config from "../config/index.js";

/* ------------------------------------------------------------------
   Cloudinary configuration
------------------------------------------------------------------- */
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

/* ------------------------------------------------------------------
   Multer configuration (MEMORY storage – Render safe)
------------------------------------------------------------------- */
const storage = multer.memoryStorage();

/* ------------------------------------------------------------------
   File filter (images + PDF only)
------------------------------------------------------------------- */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "application/pdf",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image or PDF files are allowed"), false);
  }
};

/* ------------------------------------------------------------------
   Upload limits
------------------------------------------------------------------- */
const limits = {
  fileSize: 2 * 1024 * 1024, // 2MB
};

/* ------------------------------------------------------------------
   Multer instance
------------------------------------------------------------------- */
const upload = multer({
  storage,
  fileFilter,
  limits,
});

/* ------------------------------------------------------------------
   Validate File Size
------------------------------------------------------------------- */
const validateFileSize = (file) => {
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 2MB limit`);
  }
};

/* ------------------------------------------------------------------
   Cloudinary folder mapping
------------------------------------------------------------------- */
const getCloudinaryFolder = (fieldname) => {
  switch (fieldname) {
    case "avatar":
      return "avatars";
    case "licenseDocument":
      return "licenses";
    case "galleryImages":
      return "gallery";
    case "logo":
      return "sponsor_logos";
    case "product":
      return "products";
    case "post":
      return "posts";
    case "clinic":
      return "clinics";
    case "clinicPromotion":
      return "clinic_promotions";
    case "ptPromotion":
      return "pt_promotions";
    default:
      return "others";
  }
};

/* ------------------------------------------------------------------
   Upload to Cloudinary helper
------------------------------------------------------------------- */
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided"));

    validateFileSize(file);

    const folder = getCloudinaryFolder(file.fieldname);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        transformation: [
          {
            quality: "auto:good",
            fetch_format: "auto",
          },
          {
            width: 1200,
            height: 1200,
            crop: "limit",
          },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    // 🔥 FIX HERE
    const buffer =
      file.buffer instanceof Buffer
        ? file.buffer
        : Buffer.from(file.buffer);

    uploadStream.end(buffer);
  });
};

/* ------------------------------------------------------------------
   Multiple files upload helper
------------------------------------------------------------------- */
const uploadMultipleToCloudinary = async (files = []) => {
  if (!files || files.length === 0) return [];

  // Validate all files before upload
  files.forEach((file) => validateFileSize(file));

  return Promise.all(files.map((file) => uploadToCloudinary(file)));
};;;;;;;;

/* ------------------------------------------------------------------
   Delete file from Cloudinary
------------------------------------------------------------------- */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return { deleted: false, reason: "No publicId provided" };

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return { deleted: result.result === "ok", result };
  } catch (error) {
    console.error("🚫 Cloudinary deletion failed:", error);
    throw error;
  }
};

/* ------------------------------------------------------------------
   Exports
------------------------------------------------------------------- */
export {
  upload,                    // multer middleware
  uploadToCloudinary,        // single file upload
  uploadMultipleToCloudinary,// multiple files upload
  deleteFromCloudinary,      // cleanup helper
};
