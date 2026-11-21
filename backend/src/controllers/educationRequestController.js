import mongoose from "mongoose";
import ResourceRequest from "../models/ResourceRequest.js";
import EducationResource from "../models/EducationResource.js";
import {
  EDUCATION_CATEGORIES,
  EDUCATION_FILE_TYPES,
  EDUCATION_LANGUAGES,
  REQUEST_STATUSES,
  EDUCATION_LIMITS,
} from "../constants/education.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const REQUEST_FIELDS =
  "title description category preferredFormat language requestedBy status fulfilledResource adminNotes createdAt updatedAt";

// GET /api/education/requests — authenticated, open requests
export const listRequests = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || EDUCATION_LIMITS.defaultPageSize(), 1),
      EDUCATION_LIMITS.maxPageSize(),
    );
    const status = REQUEST_STATUSES.includes(req.query.status)
      ? req.query.status
      : "open";

    const filter = { status };
    if (req.query.category && EDUCATION_CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }

    const [requests, total] = await Promise.all([
      ResourceRequest.find(filter)
        .select(REQUEST_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("requestedBy", "fullName")
        .populate("fulfilledResource", "title status"),
      ResourceRequest.countDocuments(filter),
    ]);

    res.json({
      requests,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Error listing resource requests:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
};

// POST /api/education/requests — create a request
export const createRequest = async (req, res) => {
  try {
    const {
      title,
      description = "",
      category,
      preferredFormat,
      language,
    } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!EDUCATION_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }
    if (preferredFormat && !EDUCATION_FILE_TYPES.includes(preferredFormat)) {
      return res.status(400).json({ error: "Invalid preferred format" });
    }
    if (language && !EDUCATION_LANGUAGES.includes(language)) {
      return res.status(400).json({ error: "Invalid language" });
    }

    const request = await ResourceRequest.create({
      title: title.trim(),
      description: String(description).trim(),
      category,
      preferredFormat: preferredFormat || undefined,
      language: language || undefined,
      requestedBy: req.user._id,
      status: "open",
    });

    res.status(201).json({ request });
  } catch (err) {
    console.error("Error creating resource request:", err);
    res.status(500).json({ error: "Failed to create request" });
  }
};

// GET /api/education/requests/mine — own requests
export const getMyRequests = async (req, res) => {
  try {
    const requests = await ResourceRequest.find({ requestedBy: req.user._id })
      .select(REQUEST_FIELDS)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("fulfilledResource", "title status");

    res.json({ requests });
  } catch (err) {
    console.error("Error fetching my requests:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
};

// PATCH /api/education/requests/:id/close — owner or admin closes an open request
export const closeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    const request = await ResourceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    const isOwner = request.requestedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (request.status !== "open") {
      return res.status(400).json({ error: "Only open requests can be closed" });
    }

    request.status = "closed";
    await request.save();

    res.json({ request });
  } catch (err) {
    console.error("Error closing request:", err);
    res.status(500).json({ error: "Failed to close request" });
  }
};
