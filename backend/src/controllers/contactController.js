import { sendEmail, EMAIL_FROM } from "../services/sendEmailService.js";
import { generateFiziomidiaEmail } from "../templates/emailHelper.js";

export const sendContactEmail = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    // Admin notification email
    const adminHtml = generateFiziomidiaEmail({
      title: "New Contact Message",
      body: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    await sendEmail({
      to: "admin@fiziomidia.org",
      subject: "New Contact Form Message",
      html: adminHtml,
      from: EMAIL_FROM.ADMIN,
    });

    // Optional: Auto-reply to user
    const userHtml = generateFiziomidiaEmail({
      title: "We Received Your Message",
      body: `
        <p>Hello ${name},</p>
        <p>Thank you for contacting FizioMidia. Our team will respond to you shortly.</p>
        <p><strong>Your Message:</strong></p>
        <p>${message}</p>
      `,
      buttonText: "Visit FizioMidia",
      buttonURL: "https://fiziomidia.org",
    });

    await sendEmail({
      to: email,
      subject: "We Received Your Message",
      html: userHtml,
      from: EMAIL_FROM.INFO,
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact email error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send message",
    });
  }
};
