import mongoose from "mongoose";
import User from "../../models/User.js";
import PTRequest from "../../models/PTRequest.js";
import Clinic from "../../models/Clinic.js";
import Appointment from "../../models/Appointment.js";
import Post from "../../models/Post.js";
import Comment from "../../models/Comment.js";
import ClinicPromotion from "../../models/ClinicPromotion.js";
import PTPromotion from "../../models/PTPromotion.js";
import CopyrightReport from "../../models/CopyrightReport.js";
import AIGeneratedContent from "../../models/AIGeneratedContent.js";
import AIActivityLog from "../../models/AIActivityLog.js";
import { runAgent } from "../core/agentManager.js";

/*
Virtual Administrator — Phase 3.
Daily monitoring: aggregates platform stats via plain MongoDB queries,
asks the LLM to summarize + flag anomalies, stores the report in
AIActivityLog, and (via adminMonitorScheduler) emails admins.
READ-ONLY by design — never mutates platform data.
*/

const dayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Anomaly thresholds — conservative; flags require human review
const THRESHOLDS = {
  pendingPTRequests: 10,
  pendingCopyrightReports: 5,
  pendingAIContent: 10,
  newUsersSpike: 50,
};

/**
 * Gather platform stats via conventional MongoDB queries, then ask the
 * LLM to summarize + flag anomalies. The LLM interprets; it never invents numbers.
 */
export const generateReport = async () => {
  const since = dayStart();
  const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [
    newUsers,
    pendingPT,
    newClinics,
    newPosts,
    newComments,
    appointmentsToday,
    pendingReports,
    expiringClinicPromos,
    expiringPTPromos,
    pendingAIContent,
    flaggedLogs,
  ] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: since } }),
    PTRequest.countDocuments({ status: "pending" }),
    Clinic.countDocuments({ createdAt: { $gte: since } }),
    Post.countDocuments({ createdAt: { $gte: since } }),
    Comment.countDocuments({ createdAt: { $gte: since } }),
    Appointment.countDocuments({ createdAt: { $gte: since } }),
    CopyrightReport.countDocuments({ status: "pending" }),
    ClinicPromotion.countDocuments({
      status: "active",
      endAt: { $gte: new Date(), $lte: weekAhead },
    }),
    PTPromotion.countDocuments({
      status: "active",
      endAt: { $gte: new Date(), $lte: weekAhead },
    }),
    AIGeneratedContent.countDocuments({ status: "pending_review" }),
    AIActivityLog.countDocuments({
      requiresHumanReview: true,
      reviewedAt: null,
    }),
  ]);

  const stats = {
    period: "last 24 hours",
    newUserRegistrations: newUsers,
    pendingPhysiotherapistApplications: pendingPT,
    newClinics,
    newForumPosts: newPosts,
    newForumComments: newComments,
    appointmentsCreated: appointmentsToday,
    pendingCopyrightReports: pendingReports,
    promotionsExpiringWithin7Days: expiringClinicPromos + expiringPTPromos,
    aiDraftsAwaitingReview: pendingAIContent,
    aiItemsRequiringReview: flaggedLogs,
  };

  // Rule-based anomaly flags — deterministic, stored for human review
  const anomalies = [];
  if (pendingPT > THRESHOLDS.pendingPTRequests)
    anomalies.push(
      `${pendingPT} pending PT applications (threshold ${THRESHOLDS.pendingPTRequests})`,
    );
  if (pendingReports > THRESHOLDS.pendingCopyrightReports)
    anomalies.push(
      `${pendingReports} pending copyright reports (threshold ${THRESHOLDS.pendingCopyrightReports})`,
    );
  if (pendingAIContent > THRESHOLDS.pendingAIContent)
    anomalies.push(
      `${pendingAIContent} AI drafts awaiting review (threshold ${THRESHOLDS.pendingAIContent})`,
    );
  if (newUsers > THRESHOLDS.newUsersSpike)
    anomalies.push(
      `${newUsers} new registrations in 24h — possible spike/bot activity`,
    );

  const prompt = `Here is today's FizioMidia platform activity data (all numbers are exact database counts):

${JSON.stringify(stats, null, 2)}

Rule-based anomaly flags already detected: ${anomalies.length ? anomalies.join("; ") : "none"}

Write a concise daily admin report (max 300 words):
1. Summary of activity
2. Items needing attention (pending PT applications, copyright reports, AI drafts awaiting review, expiring promotions)
3. Comment on the flagged anomalies — are they genuinely concerning or within normal range?`;

  const result = await runAgent("virtualAdmin", prompt, {
    maxOutputTokens: 900,
    temperature: 0.4,
  });

  if (!result.ok) {
    await AIActivityLog.create({
      agent: "virtualAdmin",
      action: "REPORT_GENERATION_FAILED",
      details: { code: result.code, error: result.error },
    });
    return { ok: false, error: result.error, code: result.code, stats };
  }

  // Store the report so GET /api/ai/admin/daily-report can serve it later
  await AIActivityLog.create({
    agent: "virtualAdmin",
    action: "REPORT_GENERATED",
    model: result.model,
    tokensUsed: (result.promptTokens || 0) + (result.completionTokens || 0),
    details: { stats, anomalies, report: result.text },
  });

  // Persist anomaly flags for the human-review queue
  for (const anomaly of anomalies) {
    await AIActivityLog.create({
      agent: "virtualAdmin",
      action: "ANOMALY_FLAGGED",
      requiresHumanReview: true,
      details: { anomaly, stats },
    });
  }

  return {
    ok: true,
    report: result.text,
    stats,
    anomalies,
    model: result.model,
  };
};;
