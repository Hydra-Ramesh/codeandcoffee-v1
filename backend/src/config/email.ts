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

/**
 * Send custom transactional email
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<boolean> {
  const mailTransporter = getEmailTransporter();
  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: config.smtp.from || `"Code & Coffee" <${config.smtp.user}>`,
        to,
        subject,
        text,
        html,
      });
      console.log(`✅ Email dispatched to ${to}: ${subject}`);
      return true;
    } catch (err) {
      console.error(`❌ Failed sending email to ${to}:`, (err as Error).message);
    }
  }
  console.log(`📨 [DEV EMAIL] To: ${to} | Subject: ${subject}`);
  return true;
}

/**
 * Send 6-digit OTP verification email
 */
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
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%); padding: 32px 24px; text-align: center; }
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
        from: config.smtp.from || `"Code & Coffee" <${config.smtp.user}>`,
        to: toEmail,
        subject: `☕ [Code & Coffee] Your Verification Code is ${otpCode}`,
        html: htmlContent,
      });
      console.log(`✅ SMTP Verification Email sent successfully to ${toEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Failed sending via Google SMTP, falling back to console log:', (error as Error).message);
    }
  }

  // Developer Mode logging fallback
  console.log('====================================================');
  console.log(`📨 [DEV EMAIL - OTP] To: ${toEmail}`);
  console.log(`🔑 Verification OTP: ${otpCode}`);
  console.log('====================================================');
  return true;
}

/**
 * Send Welcome / Registration confirmation email to new users
 */
export async function sendWelcomeEmail(toEmail: string, name: string): Promise<boolean> {
  const mailTransporter = getEmailTransporter();
  const exploreUrl = `${config.clientUrl}/blogs`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #090d16; color: #f3f4f6; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 18px; overflow: hidden; box-shadow: 0 15px 30px -5px rgba(0,0,0,0.6); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%); padding: 36px 24px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }
          .subtitle { color: #fef3c7; font-size: 14px; margin-top: 6px; font-weight: 500; }
          .content { padding: 32px 28px; }
          .greeting { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 16px; }
          .paragraph { color: #d1d5db; font-size: 14px; line-height: 1.7; margin-bottom: 16px; }
          .feature-box { background: #1a2234; border: 1px solid #2d3748; border-radius: 12px; padding: 18px; margin: 24px 0; }
          .feature-item { font-size: 13px; color: #e5e7eb; margin: 10px 0; display: flex; align-items: center; gap: 8px; }
          .btn-container { text-align: center; margin: 32px 0 16px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #090d16 !important; font-weight: 800; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3); }
          .link-fallback { color: #9ca3af; font-size: 12px; text-align: center; word-break: break-all; margin-top: 14px; }
          .footer { background: #0b0f19; padding: 22px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ Welcome to Code & Coffee</h1>
            <div class="subtitle">Where Deep Code Meets High Caffeine</div>
          </div>
          <div class="content">
            <div class="greeting">Hey ${name || 'Fellow Engineer'}, 👋</div>
            <p class="paragraph">
              Welcome to <strong>Code & Coffee</strong> — your dedicated publication for deep-dive system architecture, distributed backends, database scaling, and clean modern engineering.
            </p>

            <div class="feature-box">
              <div style="font-weight: 700; color: #fbbf24; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                What you can do right now:
              </div>
              <div class="feature-item">📖 <strong>Explore deep-dive technical articles</strong> crafted for builders and architects.</div>
              <div class="feature-item">💬 <strong>Engage with the community:</strong> Like, dislike, and share engineering thoughts in comment threads.</div>
              <div class="feature-item">🔔 <strong>Direct Article Alerts:</strong> You will be notified the instant our editorial board publishes a new blueprint.</div>
            </div>

            <div class="btn-container">
              <a href="${exploreUrl}" class="btn" target="_blank">Start Reading Articles →</a>
              <div class="link-fallback">
                Or visit directly: <a href="${exploreUrl}" style="color: #fbbf24;">${exploreUrl}</a>
              </div>
            </div>
          </div>
          <div class="footer">
            You received this email because you created an account on Code & Coffee.<br/>
            © 2026 Code & Coffee Developer Journal • San Francisco, CA & Bengaluru
          </div>
        </div>
      </body>
    </html>
  `;

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: config.smtp.from || `"Code & Coffee" <${config.smtp.user}>`,
        to: toEmail,
        subject: `☕ Welcome to Code & Coffee, ${name || 'Developer'}!`,
        html: htmlContent,
      });
      console.log(`✅ Welcome email sent successfully to ${toEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Failed sending welcome email via Google SMTP:', (error as Error).message);
    }
  }

  console.log('====================================================');
  console.log(`📨 [DEV EMAIL - WELCOME] To: ${toEmail} (${name})`);
  console.log(`🔗 Explore Link: ${exploreUrl}`);
  console.log('====================================================');
  return true;
}

export interface BlogBroadcastData {
  title: string;
  excerpt: string;
  slug: string;
  category: string;
  bannerImage?: string | null;
  authorName?: string;
  readingTime?: number;
}

/**
 * Send New Blog Published notification email to a subscriber
 */
export async function sendNewBlogNotificationEmail(
  toEmail: string,
  recipientName: string,
  blog: BlogBroadcastData
): Promise<boolean> {
  const mailTransporter = getEmailTransporter();
  const blogUrl = `${config.clientUrl}/blogs/${blog.slug}`;
  const readingTimeText = `${blog.readingTime || 5} min read`;

  const bannerHtml = blog.bannerImage
    ? `<div style="margin: 0 0 20px 0; border-radius: 12px; overflow: hidden; border: 1px solid #1f2937;">
        <img src="${blog.bannerImage}" alt="${blog.title}" style="width: 100%; max-height: 240px; object-fit: cover; display: block;" />
       </div>`
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #090d16; color: #f3f4f6; margin: 0; padding: 24px; }
          .container { max-width: 560px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 18px; overflow: hidden; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.6); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%); padding: 28px 24px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; }
          .content { padding: 32px 28px; }
          .category-pill { display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); color: #fbbf24; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 8px; margin-bottom: 12px; }
          .blog-title { color: #ffffff; font-size: 22px; font-weight: 800; line-height: 1.3; margin: 0 0 14px 0; }
          .meta-info { font-size: 12px; color: #9ca3af; margin-bottom: 18px; }
          .blog-excerpt { color: #d1d5db; font-size: 14px; line-height: 1.7; background: #1a2234; border-left: 3px solid #f59e0b; padding: 14px 16px; border-radius: 0 10px 10px 0; margin-bottom: 26px; }
          .btn-container { text-align: center; margin: 28px 0 14px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #090d16 !important; font-weight: 800; font-size: 15px; text-decoration: none; padding: 14px 34px; border-radius: 12px; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35); }
          .direct-link { color: #9ca3af; font-size: 12px; text-align: center; word-break: break-all; margin-top: 14px; }
          .footer { background: #0b0f19; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ Code & Coffee • New Publication</h1>
          </div>
          <div class="content">
            <span class="category-pill">${blog.category}</span>
            <span style="font-size: 12px; color: #9ca3af; margin-left: 8px;">• ${readingTimeText}</span>

            <h2 class="blog-title">${blog.title}</h2>

            <div class="meta-info">
              By <strong>${blog.authorName || 'Dev Coffee Admin'}</strong> • Published today
            </div>

            ${bannerHtml}

            <div class="blog-excerpt">
              "${blog.excerpt}"
            </div>

            <div class="btn-container">
              <a href="${blogUrl}" class="btn" target="_blank">Read Full Article Now →</a>
              <div class="direct-link">
                Direct Article Link:<br/>
                <a href="${blogUrl}" style="color: #fbbf24; text-decoration: underline;">${blogUrl}</a>
              </div>
            </div>
          </div>
          <div class="footer">
            You received this alert because you are registered on Code & Coffee.<br/>
            © 2026 Code & Coffee Developer Journal • Engineering Publications
          </div>
        </div>
      </body>
    </html>
  `;

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        from: config.smtp.from || `"Code & Coffee" <${config.smtp.user}>`,
        to: toEmail,
        subject: `☕ New Post: ${blog.title}`,
        html: htmlContent,
      });
      console.log(`✅ New post notification email sent to ${toEmail}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed sending new post email to ${toEmail}:`, (error as Error).message);
    }
  }

  console.log(`📨 [DEV EMAIL - NEW POST] To: ${toEmail} | Title: ${blog.title} | Link: ${blogUrl}`);
  return true;
}
