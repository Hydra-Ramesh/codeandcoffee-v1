import nodemailer from 'nodemailer';
import { config } from './env.js';

let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  if (config.smtp.user && config.smtp.pass) {
    try {
      transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      console.log('✅ Google SMTP transporter configured for:', config.smtp.user);
    } catch (err) {
      console.warn('⚠️ Could not configure Google SMTP, using dev console logger:', (err as Error).message);
    }
  }
  return transporter;
}

export async function sendOtpEmail(toEmail: string, otpCode: string, name?: string): Promise<boolean> {
  const mailTransporter = getEmailTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
          .container { max-width: 520px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%); padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
          .content { padding: 32px 24px; text-align: center; }
          .greeting { font-size: 16px; color: #9ca3af; margin-bottom: 20px; }
          .otp-badge { display: inline-block; background: #1f2937; border: 2px dashed #f59e0b; color: #fbbf24; font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 16px 32px; border-radius: 12px; margin: 20px 0; }
          .info { color: #9ca3af; font-size: 14px; line-height: 1.6; margin-top: 16px; }
          .footer { background: #0b0f19; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ Code & Coffee Verification</h1>
          </div>
          <div class="content">
            <p class="greeting">Hello ${name || 'Developer'},</p>
            <p style="color: #e5e7eb; font-size: 15px;">Your requested one-time security password (OTP) for password reset or verification is:</p>
            <div class="otp-badge">${otpCode}</div>
            <p class="info">This code is valid for <strong>10 minutes</strong>. If you did not initiate this request, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            © 2026 Code & Coffee Developer Journal • Security Team
          </div>
        </div>
      </body>
    </html>
  `;

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: config.smtp.from,
        to: toEmail,
        subject: `☕ [Code & Coffee] Your Verification Code is ${otpCode}`,
        html: htmlContent,
      });
      console.log(`✅ SMTP Email sent successfully to ${toEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Failed sending via Google SMTP, falling back to console log:', (error as Error).message);
    }
  }

  // Developer Test Mode output
  console.log('====================================================');
  console.log(`📨 [MOCK/DEV EMAIL] To: ${toEmail}`);
  console.log(`🔑 Verification OTP: ${otpCode}`);
  console.log('====================================================');
  return true;
}
