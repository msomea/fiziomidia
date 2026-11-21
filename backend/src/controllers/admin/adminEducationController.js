import mongoose from "mongoose";
import EducationResource from "../../models/EducationResource.js";
import ResourceRequest from "../../models/ResourceRequest.js";
import CopyrightReport from "../../models/CopyrightReport.js";
import User from "../../models/User.js";
import AdminActivityLog from "../../models/AdminActivityLog.js";
import {
  RESOURCE_STATUSES,
  REQUEST_STATUSES,
  EDUCATION_LIMITS,
} from "../../constants/education.js";
import {
  buildResourceSort,
  isValidSort,
  isValidStatusTransition,
} from "../../utils/educationHelpers.js";
import {
  deleteEducationFile,
  getSignedDownloadUrl,
  educationFileExists,
} from "../../services/educationStorage.js";
import config from "../../config/index.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Fire-and-forget admin activity log for education moderation actions.
const logEduActivity = (req, action, targetId, targetType, description, details = {}) => {
  AdminActivityLog.create({
    admin: req.user._id,
    action,
    targetId,
    targetType,
    description,
    details: { ...details, method: req.method, endpoint: req.originalUrl },
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.get("User-Agent"),
  }).catch((e) => console.error("education activity log failed:", e.message));
};

const STATUS_ACTION_MAP = {
  approved: "EDUCATION_RESOURCE_APPROVED",
  rejected: "EDUCATION_RESOURCE_REJECTED",
  suspended: "EDUCATION_RESOURCE_SUSPENDED",
  removed: "EDUCATION_RESOURCE_REMOVED",
};

const ADMIN_RESOURCE_FIELDS =
  "title description category subCategory language fileName fileType fileSize storageProvider storageBucket storageKey uploadedBy uploaderRoleAtUpload licenseType licenseUrl licenseNotes copyrightDeclaration status downloadHold downloadCount approvedBy approvedAt reviewedAt rejectionReason removedAt moderationHistory createdAt updatedAt";

// GET /api/admin/education/resources — moderation queue
export const adminListResources = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || EDUCATION_LIMITS.defaultPageSize(), 1),
      EDUCATION_LIMITS.maxPageSize(),
    );
    const status = RESOURCE_STATUSES.includes(req.query.status)
      ? req.query.status
      : undefined;
    const sort = isValidSort(req.query.sort) ? req.query.sort : "newest";

    const filter = status ? { status } : {};
    const [resources, total] = await Promise.all([
      EducationResource.find(filter)
        .select(ADMIN_RESOURCE_FIELDS)
        .sort(buildResourceSort(sort))
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("uploadedBy", "fullName email role")
        .populate("approvedBy", "fullName"),
      EducationResource.countDocuments(filter),
    ]);

    res.json({
      resources,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Error listing admin resources:", err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
};

// PATCH /api/admin/education/resources/:id/review — approve/reject/suspend/restore/remove/hold
export const adminReviewResource = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }

    const resource = await EducationResource.findById(id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const { action, reason, downloadHold } = req.body;

    // Handle download hold toggle independently of status transitions.
    if (downloadHold !== undefined) {
      const prevHold = resource.downloadHold;
      resource.downloadHold = !!downloadHold;
      resource.moderationHistory.push({
        action: resource.downloadHold ? "download_hold_set" : "download_hold_released",
        actor: req.user._id,
        reason: reason || undefined,
      });
      if (resource.downloadHold !== prevHold) {
        logEduActivity(
          req,
          resource.downloadHold
            ? "EDUCATION_DOWNLOAD_HOLD_SET"
            : "EDUCATION_DOWNLOAD_HOLD_RELEASED",
          resource._id,
          "EducationResource",
          `Download ${resource.downloadHold ? "hold set" : "hold released"} for resource "${resource.title}"`,
          { title: resource.title, reason: reason || undefined },
        );
      }
    }

    if (action !== undefined) {
      const targetStatus = action; // action is the target status
      if (!RESOURCE_STATUSES.includes(targetStatus)) {
        return res.status(400).json({ error: "Invalid action" });
      }
      if (!isValidStatusTransition(resource.status, targetStatus)) {
        return res.status(400).json({
          error: `Cannot transition from ${resource.status} to ${targetStatus}`,
        });
      }

      const prevStatus = resource.status;
      resource.status = targetStatus;
      resource.reviewedAt = new Date();

      if (targetStatus === "approved") {
        resource.approvedBy = req.user._id;
        resource.approvedAt = new Date();
        resource.rejectionReason = undefined;
      } else if (targetStatus === "rejected") {
        resource.rejectionReason = reason ? String(reason).slice(0, 1000) : undefined;
      } else if (targetStatus === "removed") {
        resource.removedAt = new Date();
      }

      resource.moderationHistory.push({
        action: `status_${targetStatus}`,
        actor: req.user._id,
        reason: reason || undefined,
      });

      const finalAction =
        targetStatus === "approved" && prevStatus === "suspended"
          ? "EDUCATION_RESOURCE_RESTORED"
          : STATUS_ACTION_MAP[targetStatus];
      logEduActivity(
        req,
        finalAction,
        resource._id,
        "EducationResource",
        `Education resource "${resource.title}" ${targetStatus}`,
        {
          title: resource.title,
          from: prevStatus,
          to: targetStatus,
          reason: reason || undefined,
        },
      );
    }

    await resource.save();
// Notify uploader of moderation decision (in-app notification array).
    if (["approved", "rejected", "suspended", "removed"].includes(resource.status)) {
      const messages = {
        approved: "Your resource was approved and is now available in the library.",
        rejected: `Your resource was rejected.${resource.rejectionReason ? ` Reason: ${resource.rejectionReason}` : ""}`,
        suspended: "Your resource was suspended.",
        removed: "Your resource was removed.",
      };
      await User.updateOne(
        { _id: resource.uploadedBy },
        {
          $push: {
            notifications: {
              $each: [
                {
                  type: "education_resource",
                  message: messages[resource.status],
                  priority: resource.status === "approved" ? "update" : "important",
                  read: false,
                },
              ],
              $slice: -50,
            },
          },
        },
      ).catch((e) => console.error("uploader notification failed:", e));
    }

    // 
    // If removed, delete the storage object (best-effort, audited).
    if (resource.status === "removed" && resource.storageKey) {
      try {
        await deleteEducationFile({ key: resource.storageKey });
      } catch (err) {
        console.error("R2 delete failed during admin removal:", err);
        resource.moderationHistory.push({
          action: "storage_delete_failed",
          actor: req.user._id,
          reason: err.message,
        });
        await resource.save();
      }
    }

    res.json({ resource });
  } catch (err) {
    console.error("Error reviewing resource:", err);
    res.status(500).json({ error: "Failed to review resource" });
  }
};

// GET /api/admin/education/requests — all requests
export const adminListRequests = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || EDUCATION_LIMITS.defaultPageSize(), 1),
      EDUCATION_LIMITS.maxPageSize(),
    );
    const status = REQUEST_STATUSES.includes(req.query.status)
      ? req.query.status
      : undefined;

    const filter = status ? { status } : {};
    const [requests, total] = await Promise.all([
      ResourceRequest.find(filter)
        .select("title description category preferredFormat language requestedBy status fulfilledResource adminNotes createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("requestedBy", "fullName email")
        .populate("fulfilledResource", "title status"),
      ResourceRequest.countDocuments(filter),
    ]);

    res.json({
      requests,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Error listing admin requests:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
};

// PATCH /api/admin/education/requests/:id — update request status / fulfill
export const adminUpdateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    const request = await ResourceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    const { status, fulfilledResource, adminNotes } = req.body;

    if (status !== undefined) {
      if (!REQUEST_STATUSES.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      request.status = status;
    }

    if (fulfilledResource !== undefined) {
      if (fulfilledResource === null) {
        request.fulfilledResource = undefined;
      } else {
        if (!isValidObjectId(fulfilledResource)) {
          return res.status(400).json({ error: "Invalid resource ID" });
        }
        const resource = await EducationResource.findById(fulfilledResource);
        if (!resource || resource.status !== "approved" || resource.downloadHold) {
          return res.status(400).json({
            error: "Fulfilled resource must be approved and downloadable",
          });
        }
        request.fulfilledResource = resource._id;
        if (!status) request.status = "fulfilled";
      }
    }

    if (adminNotes !== undefined) {
      request.adminNotes = String(adminNotes).slice(0, 2000);
    }

    await request.save();
    logEduActivity(
      req,
      "EDUCATION_REQUEST_UPDATED",
      request._id,
      "ResourceRequest",
      `Education resource request "${request.title}" updated to ${request.status}`,
      { title: request.title, status: request.status },
    );
    res.json({ request });
  } catch (err) {
    console.error("Error updating request:", err);
    res.status(500).json({ error: "Failed to update request" });
  }
};

// GET /api/admin/education/stats — dashboard metrics
export const adminEducationStats = async (req, res) => {
  try {
    const [
      pendingUploads,
      approvedResources,
      suspendedResources,
      openReports,
      openRequests,
      totalDownloads,
    ] = await Promise.all([
      EducationResource.countDocuments({ status: "pending" }),
      EducationResource.countDocuments({ status: "approved" }),
      EducationResource.countDocuments({ status: "suspended" }),
      CopyrightReport.countDocuments({
        status: { $in: ["pending", "under_review"] },
      }),
      ResourceRequest.countDocuments({ status: "open" }),
      EducationResource.aggregate([
        { $group: { _id: null, total: { $sum: "$downloadCount" } } },
      ]),
    ]);

    res.json({
      stats: {
        pendingUploads,
        approvedResources,
        suspendedResources,
        openReports,
        openRequests,
        totalDownloads: totalDownloads[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error("Error fetching education stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

// GET /api/admin/education/resources/:id/download — admin preview signed URL
// Admins can preview files in any status (except removed) for moderation.
export const adminGetResourceDownload = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }

    const resource = await EducationResource.findById(id);
    if (!resource || resource.status === "removed" || !resource.storageKey) {
      return res.status(404).json({ error: "Resource file is unavailable" });
    }

    const exists = await educationFileExists({ key: resource.storageKey });
    if (!exists) {
      return res.status(404).json({ error: "Resource file is unavailable" });
    }

    const url = await getSignedDownloadUrl({ key: resource.storageKey });

    res.json({
      downloadUrl: url,
      fileName: resource.fileName,
      fileType: resource.fileType,
      expiresIn: config.education.downloadUrlTtlSeconds,
    });
  } catch (err) {
    console.error("Error generating admin download URL:", err);
    res.status(500).json({ error: "Failed to generate download link" });
  }
};
