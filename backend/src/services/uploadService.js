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
   Cloudinary folder mapping (keeps your original logic)
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
      return "posts"
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

    const folder = getCloudinaryFolder(file.fieldname);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        transformation: [
          {
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
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
  const results = [];

  for (const file of files) {
    const result = await uploadToCloudinary(file);
    results.push(result);
  }

  return results;
};

/* ------------------------------------------------------------------
   Delete file from Cloudinary
------------------------------------------------------------------- */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
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
