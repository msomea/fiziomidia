/**
 * Reusable HTML email generator for Fiziomidia
 * @param {Object} options
 * @param {string} options.title - Email title (shown in header)
 * @param {string} options.body - Main HTML content of the email
 * @param {string} [options.buttonText] - Text for action button
 * @param {string} [options.buttonURL] - URL for the action button
 * @param {string} [options.logoURL] - Optional logo URL
 * @returns {string} - HTML email content
 */
import dayjs from "dayjs";
const currentYear = dayjs().year();

export const generateFiziomidiaEmail = ({
  title,
  body,
  buttonText,
  buttonURL,
  logoURL = "https://api.fiziomidia.org/api/logo"
}) => `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #00CC99;">
            <img 
              src="${logoURL}" 
              alt="FizioMidia Logo"
              width="160"
              style="
                display:block;
                max-width:160px;
                width:100%;
                height:auto;
                margin:0 auto 12px auto;
                border:0;
                outline:none;
                text-decoration:none;
              "
            />

            <h2 style="color: #ffffff; margin: 0;">${title}</h2>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px; color: #111827; font-size: 16px; line-height: 1.5;">
            ${body}
            ${buttonText && buttonURL ? `
            <p style="text-align: center; margin: 30px 0;">
              <a href="${buttonURL}" 
                 style="background-color: #3E92CC; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
                ${buttonText}
              </a>
            </p>` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; font-size: 12px; color: #6b7280; text-align: center; background-color: #f3f4f6;">
            © 2026 Fiziomidia. All rights reserved.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;
