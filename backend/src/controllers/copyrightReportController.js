import mongoose from "mongoose";
import CopyrightReport from "../models/CopyrightReport.js";
import EducationResource from "../models/EducationResource.js";
import {
  REPORT_REASONS,
  REPORT_STATUSES,
  EDUCATION_LIMITS,
} from "../constants/education.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const isValidEmail = (email) =>
  typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidUrl = (url) =>
  !url || /^https?:\/\//i.test(url);

// POST /api/education/resources/:id/report — submit copyright report
export const submitReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }

    const resource = await EducationResource.findById(id);
    if (!resource || resource.status === "removed") {
      return res.status(404).json({ error: "Resource not found" });
    }

    const {
      reason,
      explanation,
      complainantName,
      contactEmail,
      evidenceUrl = "",
      declaration,
    } = req.body;

    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ error: "Invalid report reason" });
    }
    if (!explanation || typeof explanation !== "string" || !explanation.trim()) {
      return res.status(400).json({ error: "Explanation is required" });
    }
    if (!complainantName || typeof complainantName !== "string" || !complainantName.trim()) {
      return res.status(400).json({ error: "Complainant name is required" });
    }
    if (!isValidEmail(contactEmail)) {
      return res.status(400).json({ error: "Valid contact email is required" });
    }
    if (!isValidUrl(evidenceUrl)) {
      return res.status(400).json({ error: "Invalid evidence URL" });
    }
    if (declaration !== "true" && declaration !== true) {
      return res.status(400).json({
        error: "Accuracy declaration is required",
      });
    }

    const report = await CopyrightReport.create({
      resource: resource._id,
      reportedBy: req.user._id,
      reason,
      explanation: explanation.trim(),
      complainantName: complainantName.trim(),
      contactEmail: contactEmail.trim().toLowerCase(),
      evidenceUrl: evidenceUrl || undefined,
      declaration: true,
      status: "pending",
    });

    res.status(201).json({
      report: {
        _id: report._id,
        resource: report.resource,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
      },
      message: "Report submitted for review",
    });
  } catch (err) {
    console.error("Error submitting copyright report:", err);
    res.status(500).json({ error: "Failed to submit report" });
  }
};

// GET /api/education/my-reports — own submitted reports
export const getMyReports = async (req, res) => {
  try {
    const reports = await CopyrightReport.find({ reportedBy: req.user._id })
      .select("resource reason status actionTaken adminNotes resolvedAt createdAt updatedAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("resource", "title status");

    res.json({ reports });
  } catch (err) {
    console.error("Error fetching my reports:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

// Admin helpers used by adminEducationController
export const adminListReports = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || EDUCATION_LIMITS.defaultPageSize(), 1),
      EDUCATION_LIMITS.maxPageSize(),
    );
    const status = REPORT_STATUSES.includes(req.query.status)
      ? req.query.status
      : undefined;

    const filter = status ? { status } : {};
    const [reports, total] = await Promise.all([
      CopyrightReport.find(filter)
        .select(
          "resource reportedBy reason explanation complainantName contactEmail evidenceUrl declaration status reviewedBy adminNotes actionTaken resolvedAt createdAt updatedAt",
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("resource", "title status fileName fileType")
        .populate("reportedBy", "fullName email")
        .populate("reviewedBy", "fullName"),
      CopyrightReport.countDocuments(filter),
    ]);

    res.json({
      reports,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Error listing reports:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

export const adminUpdateReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid report ID" });
    }

    const report = await CopyrightReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const { status, adminNotes, actionTaken } = req.body;

    if (status !== undefined) {
      if (!REPORT_STATUSES.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      report.status = status;
      if (status === "resolved" || status === "rejected") {
        report.resolvedAt = new Date();
      }
    }
    if (adminNotes !== undefined) {
      report.adminNotes = String(adminNotes).slice(0, 2000);
    }
    if (actionTaken !== undefined) {
      report.actionTaken = actionTaken;
    }
    report.reviewedBy = req.user._id;

    await report.save();
    res.json({ report });
  } catch (err) {
    console.error("Error updating report:", err);
    res.status(500).json({ error: "Failed to update report" });
  }
};
