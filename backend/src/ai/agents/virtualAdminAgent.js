import mongoose from "mongoose";
import User from "../../models/User.js";
import PTRequest from "../../models/PTRequest.js";
import Clinic from "../../models/Clinic.js";
import Appointment from "../../models/Appointment.js";
import Post from "../../models/Post.js";
import AIActivityLog from "../../models/AIActivityLog.js";
import { runAgent } from "../core/agentManager.js";

/*
Virtual Administrator — Phase 0 stub.
Phase 3 implements: full monitoring queries, daily report job,
anomaly flagging, admin dashboard endpoints.
This stub provides generateReport() used by tests/admin trigger.
READ-ONLY by design — never mutates platform data.
*/

const dayStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Gather platform stats via conventional MongoDB queries, then ask the
 * LLM to summarize + flag anomalies. The LLM interprets; it never invents numbers.
 */
export const generateReport = async () => {
  const since = dayStart();

  const [newUsers, pendingPT, newClinics, newPosts, appointmentsToday, flaggedLogs] =
    await Promise.all([
      User.countDocuments({ createdAt: { $gte: since } }),
      PTRequest.countDocuments({ status: "pending" }),
      Clinic.countDocuments({ createdAt: { $gte: since } }),
      Post.countDocuments({ createdAt: { $gte: since } }),
      Appointment.countDocuments({ createdAt: { $gte: since } }),
      AIActivityLog.countDocuments({
        requiresHumanReview: true,
        reviewedAt: null,
      }),
    ]);

  const stats = {
    period: "last 24 hours",
    newUserRegistrations: newUsers,
    pendingPhysiotherapistApplications: pendingPT,
    newClinics: newClinics,
    newForumPosts: newPosts,
    appointmentsCreated: appointmentsToday,
    aiItemsRequiringReview: flaggedLogs,
  };

  const prompt = `Here is today's FizioMidia platform activity data (all numbers are exact database counts):

${JSON.stringify(stats, null, 2)}

Write a concise daily admin report (max 250 words):
1. Summary of activity
2. Items needing attention (pending PT applications, unreviewed AI content)
3. Any anomalies worth investigating`;

  const result = await runAgent("virtualAdmin", prompt, {
    maxOutputTokens: 700,
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

  await AIActivityLog.create({
    agent: "virtualAdmin",
    action: "REPORT_GENERATED",
    model: result.model,
    tokensUsed: (result.promptTokens || 0) + (result.completionTokens || 0),
  });

  return { ok: true, report: result.text, stats, model: result.model };
};
