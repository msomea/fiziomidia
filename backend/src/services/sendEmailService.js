import { Resend } from "resend";
import config from "../config/index.js";

if (!config.resendApiKey) {
  console.warn(
    "📮 RESEND_API_KEY is not configured — emails will fail to send."
  );
}

const resend = new Resend(config.resendApiKey);

// Centralized sender identities
export const EMAIL_FROM = {
  INFO: "FizioMidia <info@fiziomidia.org>",
  ADMIN: "FizioMidia Admin <admin@fiziomidia.org>",
  NO_REPLY: "FizioMidia <no-reply@fiziomidia.org>",
};

/**
 * Send an email using Resend
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} [options.from] - Sender identity
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  from = EMAIL_FROM.INFO,
}) => {
  try {
    return await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("📮 Email sending failed:", err);
    throw err;
  }
};
