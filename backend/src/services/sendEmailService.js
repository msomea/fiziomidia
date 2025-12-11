import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST, // smtp.resend.com
      port: Number(process.env.MAIL_PORT), // 587
      secure: false, // IMPORTANT: must be false for Resend
      auth: {
        user: process.env.MAIL_USER, // "resend"
        pass: process.env.MAIL_PASS, // re_xxxxxx
      },
      tls: {
        rejectUnauthorized: false, // prevents SSL incorrect version errors
      },
    });

    await transporter.sendMail({
      from: `"FizioMidia" <onboarding@resend.dev>`, // or your resend domain
      to,
      subject,
      html,
    });

  } catch (error) {
    console.error("📮 Email sending failed:", error);
    throw error;
  }
};
