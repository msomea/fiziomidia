import multer from "multer";
import {
  EDUCATION_FILE_EXTENSIONS,
  EDUCATION_FILE_TYPE_MIMES,
  EDUCATION_LIMITS,
} from "../constants/education.js";

// Dedicated multer instance for education documents.
// Memory storage keeps files out of the filesystem (Render-safe) and
// matches the existing uploadService.js convention.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const originalName = file.originalname || "";
  const ext = originalName.includes(".")
    ? originalName.slice(originalName.lastIndexOf(".")).toLowerCase()
    : "";

  const allowedExts = Object.values(EDUCATION_FILE_EXTENSIONS).flat();
  const allowedMimes = Object.values(EDUCATION_FILE_TYPE_MIMES).flat();

  const extOk = allowedExts.includes(ext);
  const mimeOk = allowedMimes.includes(file.mimetype);

  if (extOk && mimeOk) {
    return cb(null, true);
  }

  const err = new Error(
    "Unsupported file type. Allowed: PDF, DOCX, PPTX, EPUB.",
  );
  err.statusCode = 400;
  err.code = "INVALID_FILE_TYPE";
  return cb(err, false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: EDUCATION_LIMITS.maxFileSizeBytes(),
    files: 1,
  },
});

// Wrapper that maps multer errors to consistent API responses.
export const educationUploadSingle = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: `File exceeds the ${EDUCATION_LIMITS.maxFileSizeMb()}MB limit`,
        });
      }
      return res.status(400).json({ error: err.message });
    }

    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }

    return next(err);
  });
};

export default upload;
