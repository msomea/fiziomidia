import { Resend } from "resend";
import config from "../config/index.js";

if (!config.resendApiKey) {
  console.warn(
    "RESEND_API_KEY is not configured — emails will fail to send in non-dev environments.",
  );
}

const resend = new Resend(config.resendApiKey);

/**
 * Send an email using Resend API
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await resend.emails.send({
      from: `"FizioMidia" <onboarding@resend.dev>`,
      to,
      subject,
      html,
    });

    return response;
  } catch (err) {
    console.error("📮 Email sending failed:", err);
    throw err;
  }
};
