import crypto from 'crypto';
import { sendEmail } from './emailService';

export const generateOtp = () => {
  return crypto.randomInt(100000, 1000000);
};

export const generateExpiresIn = () => {
  return Date.now() + 5 * 60 * 1000;
};
export const sendOtp = async (to: string, otp: string) => {
  const subject = 'Verify Your Email';

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; padding:40px; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <h2 style="margin:0; color:#333;">Email Verification</h2>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-bottom:20px; color:#555; font-size:15px;">
                Use the OTP below to verify your email address.
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:20px 0;">
                <div style="
                  display:inline-block;
                  padding:18px 32px;
                  font-size:28px;
                  font-weight:bold;
                  letter-spacing:8px;
                  background:#f0f4ff;
                  border-radius:10px;
                  color:#3b5bdb;
                ">
                  ${otp}
                </div>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-top:10px; color:#777; font-size:14px;">
                This code will expire in <strong>5 minutes</strong>.
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-top:30px; font-size:13px; color:#999;">
                If you did not request this email, you can safely ignore it.
              </td>
            </tr>

          </table>

          <table width="500" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding-top:20px; font-size:12px; color:#aaa;">
                © ${new Date().getFullYear()} Your App Name. All rights reserved.
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  await sendEmail({
    to,
    subject,
    html,
  });
};
