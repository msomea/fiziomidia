import jwt from "jsonwebtoken";
import AIConfiguration from "../../models/AIConfiguration.js";
import ForumSub from "../../models/ForumSub.js";
import { sendEmail, EMAIL_FROM } from "../../services/sendEmailService.js";
import config from "../../config/index.js";

/*
Approval notification service — emails admins when AI-generated
content is ready for review. Review itself happens in the admin
dashboard (authenticated); the email carries a signed, expiring
deep-link token so the link can't be forged or replayed forever.
*/

const TOKEN_TTL = "7d";

const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const signReviewToken = (contentId) =>
  jwt.sign(
    { purpose: "ai-content-review", cid: String(contentId) },
    config.jwt.accessSecret,
    { expiresIn: TOKEN_TTL },
  );

// Predefined review recipients — domain mailboxes, not personal admin
// accounts (not all admins have @fiziomidia.org access). Extra addresses
// can be added via AIConfiguration.adminEmail (comma/semicolon separated).
const DEFAULT_REVIEW_EMAILS = ["admin@fiziomidia.org"];

export const resolveAdminEmails = async () => {
  const emails = new Set(DEFAULT_REVIEW_EMAILS);
  try {
    const cfg = await AIConfiguration.findOne().lean();
    if (cfg?.adminEmail) {
      String(cfg.adminEmail)
        .split(/[;,\s]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes("@"))
        .forEach((e) => emails.add(e));
    }
  } catch {
    // DB unavailable — defaults still apply
  }
  return [...emails];
};

/**
 * Notify admins that generated content awaits review.
 * Never throws — notification failure must not break the pipeline.
 */
export const notifyContentReview = async (content) => {
  try {
    const to = await resolveAdminEmails();
    if (to.length === 0) {
      console.warn("AI approval: no admin email resolved — skipping notification");
      return { ok: false, reason: "no-admin-email" };
    }

    const token = signReviewToken(content._id);
    const base = config.clientUrl || "https://fiziomidia.org";
    const link = `${base}/admin?aiReview=${token}`;
let subLabel = String(content.forumSub || "n/a");
    if (content.forumSub) {
      const sub = await ForumSub.findById(content.forumSub).select("title").lean();
      if (sub?.title) {
        const t = sub.title;
        subLabel =
          typeof t === "string"
            ? t
            : [t.sw, t.en].filter(Boolean).join(" / ") || subLabel;
      }
    }

    await sendEmail({
      to,
      from: EMAIL_FROM.ADMIN,
      subject: `[FizioMidia AI] Draft ready for review: ${content.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px">
          <h2 style="color:#0d6e6e">AI-generated content awaiting review</h2>
          <p><strong>Agent:</strong> ${escapeHtml(content.agent)}</p>
          <p><strong>Title:</strong> ${escapeHtml(content.title)}</p>
          <p><strong>Subforum:</strong> ${escapeHtml(subLabel)}</p>
          <h3 style="color:#0d6e6e;margin-bottom:4px">Full draft body</h3>
          <div style="background:#f4f8f8;border:1px solid #d7eaea;border-radius:8px;padding:16px;white-space:pre-wrap;font-size:14px;line-height:1.6">${escapeHtml(content.body)}</div>
          <p style="margin-top:16px">Please review accuracy, language and appropriateness before approving.
             Nothing is published until a human approves it.</p>
          <p><a href="${link}" style="background:#0d6e6e;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Review in Admin Dashboard</a></p>
          <p style="color:#888;font-size:12px">This link expires in 7 days. You can also review all drafts under Admin → AI Agents &amp; Knowledge Base.</p>
        </div>`,
    });
    return { ok: true };
  } catch (err) {
    console.error("AI approval notification failed:", err.message);
    return { ok: false, reason: err.message };
  }
};
