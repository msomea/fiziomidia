import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { educationUploadSingle } from "../middlewares/educationUpload.js";
import { limiters } from "../utils/rateLimiter.js";
import {
  listResources,
  listRecentResources,
  getResource,
  uploadResource,
  getMyResources,
  getDownloadUrl,
  deleteResource,
} from "../controllers/educationController.js";
import {
  listRequests,
  createRequest,
  getMyRequests,
  closeRequest,
} from "../controllers/educationRequestController.js";
import {
  submitReport,
  getMyReports,
} from "../controllers/copyrightReportController.js";

const router = express.Router();

// Public library (approved resources only)
router.get("/resources", listResources);
router.get("/resources/recent", listRecentResources);
router.get("/resources/:id", getResource);

// Authenticated: upload
router.post(
  "/resources",
  authenticate,
  limiters.educationUpload,
  educationUploadSingle,
  uploadResource,
);

// Authenticated: own uploads
router.get("/my-resources", authenticate, getMyResources);

// Authenticated: authorized download
router.get("/resources/:id/download", authenticate, getDownloadUrl);

// Authenticated: owner withdraw / admin removal
router.delete("/resources/:id", authenticate, deleteResource);

// Resource requests
router.get("/requests", authenticate, listRequests);
router.post(
  "/requests",
  authenticate,
  limiters.educationRequest,
  createRequest,
);
router.get("/requests/mine", authenticate, getMyRequests);
router.patch("/requests/:id/close", authenticate, closeRequest);

// Copyright reports
router.post(
  "/resources/:id/report",
  authenticate,
  limiters.educationReport,
  submitReport,
);
router.get("/my-reports", authenticate, getMyReports);

export default router;
