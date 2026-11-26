import crypto from "crypto";
import DownloadLog from "../models/DownloadLog.js";
import { EDUCATION_LIMITS } from "../constants/education.js";
import {
  EDUCATION_FILE_EXTENSIONS,
  EDUCATION_FILE_TYPE_MIMES,
  RESOURCE_STATUS_TRANSITIONS,
  RESOURCE_SORT_FIELDS,
} from "../constants/education.js";

// Sanitize a user-supplied filename for safe display/storage metadata.
export const sanitizeFileName = (name = "") => {
  const base = name.split(/[\\/]/).pop() || "file";
  return base
    .replace(/[^\w.\- ()[]]+/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 255);
};

// Detect file type from extension + declared MIME. Returns the canonical
// fileType key (pdf|docx|pptx|epub) or null.
export const detectFileType = (originalName = "", mimetype = "") => {
  const ext = originalName.includes(".")
    ? originalName.slice(originalName.lastIndexOf(".")).toLowerCase()
    : "";

  for (const [type, exts] of Object.entries(EDUCATION_FILE_EXTENSIONS)) {
    if (!exts.includes(ext)) continue;
    const mimes = EDUCATION_FILE_TYPE_MIMES[type] || [];
    if (mimes.includes(mimetype)) return type;
  }
  return null;
};

// Magic-byte / signature validation.
// PDF: "%PDF-" header. ZIP-based formats (docx/pptx/epub): "PK\x03\x04".
// Returns true when the buffer plausibly matches the declared type.
export const validateFileSignature = (buffer, fileType) => {
  if (!buffer || buffer.length < 4) return false;

  if (fileType === "pdf") {
    return buffer.slice(0, 5).toString("latin1") === "%PDF-";
  }

  if (["docx", "pptx", "epub"].includes(fileType)) {
    // ZIP local file header signature
    return buffer[0] === 0x50 && buffer[1] === 0x4b &&
      (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
      (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08);
  }

  return false;
};

// Generate a server-owned storage key. Never trust client-supplied paths.
export const generateStorageKey = (resourceId, fileType, originalName) => {
  const ext =
    (EDUCATION_FILE_EXTENSIONS[fileType] || [".bin"])[0];
  const uuid = crypto.randomUUID();
  const safeBase = sanitizeFileName(originalName).replace(/\.[^.]+$/, "");
  const slug = safeBase
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "resource";
  return `education/${resourceId}/${uuid}-${slug}${ext}`;
};

// Validate a requested status transition. Returns true if allowed.
export const isValidStatusTransition = (from, to) => {
  const allowed = RESOURCE_STATUS_TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
};

// Build a safe sort spec from query params. Only allowlisted fields.
export const buildResourceSort = (sort = "newest") => {
  switch (sort) {
    case "title":
      return { title: 1 };
    case "downloads":
      return { downloadCount: -1, createdAt: -1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
};

export const isValidSort = (sort) =>
  !sort || RESOURCE_SORT_FIELDS.includes(sort);

// Fields safe to expose on public resource payloads.
export const PUBLIC_RESOURCE_FIELDS =
  "title description category subCategory language fileName fileType fileSize licenseType licenseUrl licenseNotes uploadedBy createdAt downloadCount downloadHold";

// Fields safe for owners viewing their own uploads (adds private fields).
export const OWNER_RESOURCE_FIELDS =
  `${PUBLIC_RESOURCE_FIELDS} status downloadHold rejectionReason reviewedAt approvedAt removedAt`;

// ---- Daily download quota ----

// UTC day key, e.g. "2026-11-22".
export const todayKey = () => new Date().toISOString().slice(0, 10);

export const dailyDownloadLimit = () => EDUCATION_LIMITS.dailyDownloadLimit();

// Count how many downloads a user has used today (UTC).
export const getDailyDownloadCount = async (userId) => {
  if (!userId) return 0;
  return DownloadLog.countDocuments({ user: userId, date: todayKey() });
};

// Quota snapshot for a user: { limit, used, remaining }.
export const getDownloadQuota = async (userId) => {
  const limit = dailyDownloadLimit();
  const used = await getDailyDownloadCount(userId);
  return { limit, used, remaining: Math.max(0, limit - used) };
};

// Record a successful authorized download against today's quota.
export const recordDownload = async (userId, resourceId) => {
  if (!userId || !resourceId) return;
  try {
    await DownloadLog.create({
      user: userId,
      resource: resourceId,
      date: todayKey(),
    });
  } catch (err) {
    // Quota logging must never break the download flow.
    console.error("DownloadLog create failed:", err);
  }
};
