import cron from "node-cron";
import AIConfiguration from "../../models/AIConfiguration.js";
import ForumSub from "../../models/ForumSub.js";
import AIGeneratedContent from "../../models/AIGeneratedContent.js";
import AIActivityLog from "../../models/AIActivityLog.js";
import { generateDraft } from "./forumContentAgent.js";
import { notifyContentReview } from "../services/approvalService.js";

/*
Forum Content Scheduler — Phase 2.
Reads the forumContent agent's cron `schedule` from AIConfiguration
(null → agent never auto-runs; manual trigger still available via
POST /api/ai/forum/draft). Each run generates one draft per forum
subcategory, then emails admins for review. Quota enforcement lives
in runAgent — the job stops gracefully when the daily cap is hit.
*/

const MAX_SUBS_PER_RUN = 5;

export const runForumContentJob = async () => {
  const cfg = await AIConfiguration.findOne().lean();
  if (cfg && cfg.enabled === false) return { ok: false, reason: "AI disabled" };
  // Rotate: pick the subforums whose last AI draft is oldest (never
  // generated first), so every run covers different topics instead of
  // always the same first N in DB order.
  const allSubs = await ForumSub.find({}).select("_id").lean();
  if (allSubs.length === 0) return { ok: false, reason: "no forum subcategories" };

  const lastDrafts = await AIGeneratedContent.find({ agent: "forumContent" })
    .sort({ createdAt: -1 })
    .select("forumSub createdAt")
    .lean();
  const lastGen = new Map(); // forumSubId -> timestamp of newest draft
  for (const d of lastDrafts) {
    const key = String(d.forumSub);
    if (!lastGen.has(key)) lastGen.set(key, d.createdAt);
  }

  const subs = allSubs
    .map((s) => ({ ...s, last: lastGen.get(String(s._id))?.getTime() || 0 }))
    .sort((a, b) => a.last - b.last)
    .slice(0, MAX_SUBS_PER_RUN);

  const drafts = [];
  for (const sub of subs) {
    const result = await generateDraft(sub._id);
    if (result.ok) drafts.push(result.draft);
    else if (result.code === "AI_QUOTA_EXCEEDED") break; // cap hit — stop spending
  }

  // Stamp lastRunAt on the agent config
  await AIConfiguration.updateOne(
    {},
    { $set: { "agents.$[a].lastRunAt": new Date() } },
    { arrayFilters: [{ "a.name": "forumContent" }] },
  );

  if (drafts.length > 0) {
    // Notify once per run with the first draft (admins review all in dashboard)
    await notifyContentReview(drafts[0]);
    await AIActivityLog.create({
      agent: "forumContent",
      action: "SCHEDULED_RUN",
      details: { draftsGenerated: drafts.length, subIds: subs.map((s) => String(s._id)) },
    });
  }

  return { ok: true, draftsGenerated: drafts.length };
};

let scheduled = false;

/**
 * Register the cron job if a schedule is configured.
 * Called once at server startup (app.js). Re-call after config change
 * is not supported — restart required (documented limitation).
 */
export const registerForumScheduler = async () => {
  if (scheduled) return;
  const cfg = await AIConfiguration.findOne().lean();
  const agentCfg = cfg?.agents?.find((a) => a.name === "forumContent");
  const expr = agentCfg?.schedule;

  if (!expr || agentCfg?.enabled === false) {
    console.log("🗓️  Forum content scheduler: no schedule configured — manual triggers only");
    return;
  }
  if (!cron.validate(expr)) {
    console.warn(`🗓️  Forum content scheduler: invalid cron expression "${expr}" — disabled`);
    return;
  }

  cron.schedule(expr, async () => {
    try {
      const result = await runForumContentJob();
      console.log("🗓️  Forum content job:", result);
    } catch (err) {
      console.error("🗓️  Forum content job failed:", err);
    }
  });
  scheduled = true;
  console.log(`🗓️  Forum content scheduler registered: "${expr}"`);
};
