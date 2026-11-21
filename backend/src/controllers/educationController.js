import mongoose from "mongoose";
import EducationResource from "../models/EducationResource.js";
import CopyrightReport from "../models/CopyrightReport.js";
import escapeRegExp from "../utils/escapeRegExp.js";
import {
  sanitizeFileName,
  detectFileType,
  validateFileSignature,
  generateStorageKey,
  buildResourceSort,
  isValidSort,
  PUBLIC_RESOURCE_FIELDS,
  OWNER_RESOURCE_FIELDS,
} from "../utils/educationHelpers.js";
import {
  EDUCATION_CATEGORIES,
  EDUCATION_SUBCATEGORIES,
  EDUCATION_FILE_TYPES,
  EDUCATION_LANGUAGES,
  EDUCATION_LICENSE_TYPES,
  EDUCATION_LIMITS,
} from "../constants/education.js";
import {
  uploadEducationFile,
  getSignedDownloadUrl,
  educationFileExists,
  deleteEducationFile,
} from "../services/educationStorage.js";
import config from "../config/index.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Public fields never include storage internals.
const publicResource = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  delete obj.storageKey;
  delete obj.storageBucket;
  delete obj.moderationHistory;
  delete obj.rejectionReason;
  return obj;
};

// GET /api/education/resources — public approved library listing
export const listResources = async (req, res) => {
  try {
    const {
      search = "",
      category,
      subCategory,
      language,
      fileType,
      sort = "newest",
      page = 1,
      limit,
    } = req.query;

    if (!isValidSort(sort)) {
      return res.status(400).json({ error: "Invalid sort field" });
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(
      Math.max(
        parseInt(limit, 10) || EDUCATION_LIMITS.defaultPageSize(),
        1,
      ),
      EDUCATION_LIMITS.maxPageSize(),
    );

    const filter = { status: "approved", downloadHold: false };

    if (search && typeof search === "string" && search.trim()) {
      const term = escapeRegExp(search.trim().slice(0, 100));
      filter.$or = [
        { title: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
      ];
    }
    if (category && EDUCATION_CATEGORIES.includes(category)) {
      filter.category = category;
    }
    if (subCategory && typeof subCategory === "string") {
      filter.subCategory = subCategory.slice(0, 100);
    }
    if (language && EDUCATION_LANGUAGES.includes(language)) {
      filter.language = language;
    }
    if (fileType && EDUCATION_FILE_TYPES.includes(fileType)) {
      filter.fileType = fileType;
    }

    const [resources, total] = await Promise.all([
      EducationResource.find(filter)
        .select(PUBLIC_RESOURCE_FIELDS)
        .sort(buildResourceSort(sort))
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("uploadedBy", "fullName profileImageUrl"),
      EducationResource.countDocuments(filter),
    ]);

    res.json({
      resources: resources.map(publicResource),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("Error listing education resources:", err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
};

// GET /api/education/resources/recent — recently approved (for hub)
export const listRecentResources = async (req, res) => {
  try {
    const limit = Math.min(
      parseInt(req.query.limit, 10) || 6,
      EDUCATION_LIMITS.maxPageSize(),
    );
    const resources = await EducationResource.find({
      status: "approved",
      downloadHold: false,
    })
      .select(PUBLIC_RESOURCE_FIELDS)
      .sort({ approvedAt: -1, createdAt: -1 })
      .limit(limit)
      .populate("uploadedBy", "fullName");

    res.json({ resources: resources.map(publicResource) });
  } catch (err) {
    console.error("Error fetching recent resources:", err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
};

// GET /api/education/resources/:id — public details (approved only)
export const getResource = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }

    const resource = await EducationResource.findOne({
      _id: id,
      status: "approved",
      downloadHold: false,
    })
      .select(PUBLIC_RESOURCE_FIELDS)
      .populate("uploadedBy", "fullName profileImageUrl");

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    res.json({ resource: publicResource(resource) });
  } catch (err) {
    console.error("Error fetching resource:", err);
    res.status(500).json({ error: "Failed to fetch resource" });
  }
};

// POST /api/education/resources — authenticated upload
export const uploadResource = async (req, res) => {
  const file = req.file;
  let storageKey = null;

  try {
    if (!file || !file.buffer || file.buffer.length === 0) {
      return res.status(400).json({ error: "No file provided" });
    }

    const {
      title,
      description = "",
      category,
      subCategory = "",
      language = "en",
      licenseType,
      licenseUrl = "",
      licenseNotes = "",
      copyrightDeclaration,
    } = req.body;

    // Metadata validation
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!EDUCATION_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }
    if (subCategory) {
      const allowedSubs = EDUCATION_SUBCATEGORIES[category] || [];
      if (allowedSubs.length && !allowedSubs.includes(subCategory)) {
        return res.status(400).json({ error: "Invalid subcategory" });
      }
    }
    if (!EDUCATION_LANGUAGES.includes(language)) {
      return res.status(400).json({ error: "Invalid language" });
    }
    if (!EDUCATION_LICENSE_TYPES.includes(licenseType)) {
      return res.status(400).json({ error: "Invalid license type" });
    }
    if (licenseType === "other_authorized" && !licenseNotes.trim()) {
      return res.status(400).json({
        error: "License notes are required for other_authorized",
      });
    }
    if (copyrightDeclaration !== "true" && copyrightDeclaration !== true) {
      return res.status(400).json({
        error: "Copyright declaration is required",
      });
    }
    if (licenseUrl && !/^https?:\/\//i.test(licenseUrl)) {
      return res.status(400).json({ error: "Invalid license URL" });
    }

    // File validation
    const fileType = detectFileType(file.originalname, file.mimetype);
    if (!fileType) {
      return res.status(400).json({ error: "Unsupported file type" });
    }
    if (file.size > EDUCATION_LIMITS.maxFileSizeBytes()) {
      return res.status(413).json({
        error: `File exceeds the ${config.education.maxFileSizeMb}MB limit`,
      });
    }
    if (!validateFileSignature(file.buffer, fileType)) {
      return res.status(400).json({
        error: "File content does not match its declared type",
      });
    }

    const fileName = sanitizeFileName(file.originalname);

    // Create pending record first to obtain an ID for the storage key.
    const resource = await EducationResource.create({
      title: title.trim(),
      description: String(description).trim(),
      category,
      subCategory: subCategory || undefined,
      language,
      fileName,
      fileType,
      fileSize: file.size,
      storageProvider: "r2",
      uploadedBy: req.user._id,
      uploaderRoleAtUpload: req.user.role,
      licenseType,
      licenseUrl: licenseUrl || undefined,
      licenseNotes: licenseNotes || undefined,
      copyrightDeclaration: true,
      status: "pending",
    });

    storageKey = generateStorageKey(resource._id, fileType, fileName);

    await uploadEducationFile({
      key: storageKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    resource.storageBucket = config.r2.bucketName;
    resource.storageKey = storageKey;
    await resource.save();

    res.status(201).json({
      resource: {
        _id: resource._id,
        title: resource.title,
        status: resource.status,
        fileName: resource.fileName,
        fileType: resource.fileType,
        fileSize: resource.fileSize,
        createdAt: resource.createdAt,
      },
      message: "Resource submitted and pending review",
    });
  } catch (err) {
    console.error("Error uploading education resource:", err);
    // Cleanup: remove orphaned storage object if DB save failed after upload.
    if (storageKey) {
      try {
        await deleteEducationFile({ key: storageKey });
      } catch (cleanupErr) {
        console.error("Failed to cleanup orphaned R2 object:", cleanupErr);
      }
    }
    res.status(500).json({ error: "Failed to upload resource" });
  }
};

// GET /api/education/my-resources — owner's uploads
export const getMyResources = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      EDUCATION_LIMITS.maxPageSize(),
    );

    const filter = { uploadedBy: req.user._id };
    const [resources, total] = await Promise.all([
      EducationResource.find(filter)
        .select(OWNER_RESOURCE_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      EducationResource.countDocuments(filter),
    ]);

    res.json({
      resources: resources.map((r) => {
        const obj = r.toObject();
        delete obj.storageKey;
        delete obj.storageBucket;
        delete obj.moderationHistory;
        return obj;
      }),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching my resources:", err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
};

// GET /api/education/resources/:id/download — authorized signed URL
export const getDownloadUrl = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }

    const resource = await EducationResource.findById(id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const eligible =
      resource.status === "approved" &&
      !resource.downloadHold &&
      !!resource.storageKey;

    if (!eligible) {
      return res.status(403).json({ error: "Resource is not available for download" });
    }

    const exists = await educationFileExists({ key: resource.storageKey });
    if (!exists) {
      return res.status(404).json({ error: "Resource file is unavailable" });
    }

    const url = await getSignedDownloadUrl({ key: resource.storageKey });

    // Count authorized downloads (best-effort; not a unique-user metric).
    EducationResource.updateOne(
      { _id: resource._id },
      { $inc: { downloadCount: 1 } },
    ).catch((e) => console.error("downloadCount update failed:", e));

    res.json({
      downloadUrl: url,
      fileName: resource.fileName,
      fileType: resource.fileType,
      expiresIn: config.education.downloadUrlTtlSeconds,
    });
  } catch (err) {
    console.error("Error generating download URL:", err);
    res.status(500).json({ error: "Failed to generate download link" });
  }
};

// DELETE /api/education/resources/:id — owner withdraw (pending only) or admin removal
export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }

    const resource = await EducationResource.findById(id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const isOwner = resource.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Owners may only withdraw pending resources; admins may remove any.
    if (isOwner && !isAdmin && resource.status !== "pending") {
      return res.status(403).json({
        error: "Only pending resources can be withdrawn",
      });
    }

    const previousStatus = resource.status;
    resource.status = "removed";
    resource.removedAt = new Date();
    resource.moderationHistory.push({
      action: isAdmin ? "admin_removed" : "owner_withdrawn",
      actor: req.user._id,
      reason: req.body?.reason || undefined,
    });
    await resource.save();

    // Delete storage object; keep DB record for audit.
    if (resource.storageKey) {
      try {
        await deleteEducationFile({ key: resource.storageKey });
      } catch (err) {
        console.error("R2 delete failed for resource", id, err);
        resource.moderationHistory.push({
          action: "storage_delete_failed",
          actor: req.user._id,
          reason: err.message,
        });
        await resource.save();
      }
    }

    res.json({
      message: "Resource removed",
      previousStatus,
      status: resource.status,
    });
  } catch (err) {
    console.error("Error deleting resource:", err);
    res.status(500).json({ error: "Failed to remove resource" });
  }
};
