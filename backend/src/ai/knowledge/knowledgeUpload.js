import multer from "multer";

/*
Multer config for AI knowledge document uploads.
Separate from uploadService (Cloudinary/images) — knowledge files are
kept in memory only, text-extracted, chunked, then discarded. The
original binary is NOT persisted (content lives in AIKnowledgeChunk).
*/

const ALLOWED = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/x-markdown",
]);

const ALLOWED_EXT = /\.(pdf|txt|md|markdown)$/i;

const fileFilter = (req, file, cb) => {
  const okMime = ALLOWED.has(file.mimetype);
  const okExt = ALLOWED_EXT.test(file.originalname || "");
  if (okMime || okExt) return cb(null, true);
  cb(new Error("Only PDF, TXT or Markdown files are allowed"));
};

export const knowledgeUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB — WHO guidelines can be large
});
