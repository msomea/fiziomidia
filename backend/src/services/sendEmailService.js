import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY);

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
      from: `"FizioMidia" <onboarding@resend.dev>` ,
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
