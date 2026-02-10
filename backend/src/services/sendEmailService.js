import nodemailer from "nodemailer";
import config from "../config/index.js";

if (!config.mailPass) {
  console.warn(
    "📮 MAIL_PASS is not configured — emails will fail to send in non-dev environments."
  );
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "msomearaphael@gmail.com",
    pass: config.mailPass,
  },
});

/**
 * Send an email using SMTP (ImprovMX)
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await transporter.sendMail({
      from: `"Fiziomidia" <info@fiziomidia.org>`,
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
