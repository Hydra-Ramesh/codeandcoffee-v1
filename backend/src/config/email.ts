import nodemailer from 'nodemailer';
import { config } from './env.js';
import { smtpCircuitBreaker } from '../utils/circuitBreaker.js';

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
      console.log(`✅ SMTP transporter configured for [${config.smtp.host}]:`, config.smtp.user);
    } catch (err) {
      console.warn(`⚠️ Could not configure SMTP [${config.smtp.host}], using dev console logger:`, (err as Error).message);
    }
  }
  return transporter;
}

/**
/**
 * Send custom transactional email using Resend HTTPS REST API (Port 443) with SMTP fallback
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}): Promise<boolean> {
  const from = config.smtp.from || 'Code & Coffee <noreply@rameshdas.online>';
  const resendApiKey =
    process.env.RESEND_API_KEY ||
    (config.smtp.pass?.startsWith('re_') ? config.smtp.pass : null);

  // 1. Direct Resend HTTPS REST API (Port 443 - zero firewall blocks on Render / Vercel / Cloud)
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html: html || text,
          text,
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      });

      const data = (await res.json()) as any;
      if (res.ok && data?.id) {
        console.log(`✅ [Resend REST API] Email successfully delivered to ${to}: "${subject}" (ID: ${data.id})`);
        return true;
      } else {
        console.warn(`⚠️ [Resend REST API] Note for ${to}:`, data);
      }
    } catch (err: any) {
      console.warn(`⚠️ [Resend REST API] Request error for ${to}:`, err.message);
    }
  }

  // 2. Nodemailer SMTP Fallback
  const mailTransporter = getEmailTransporter();
  if (mailTransporter) {
    return smtpCircuitBreaker.execute(
      async () => {
        await mailTransporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
          ...(replyTo ? { replyTo } : {}),
        });
        console.log(`✅ [SMTP] Email dispatched to ${to}: ${subject}`);
        return true;
      },
      (err: Error) => {
        console.warn(`📨 [CircuitBreaker Fallback] Bypassing SMTP for ${to}: ${err.message}`);
        console.log(`📨 [DEV EMAIL FALLBACK] To: ${to} | Subject: ${subject}`);
        return true;
      }
    );
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

  return sendEmail({
    to: toEmail,
    subject: `☕ [Code & Coffee] Your Verification Code is ${otpCode}`,
    html: htmlContent,
  });
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

  return sendEmail({
    to: toEmail,
    subject: `☕ Welcome to Code & Coffee, ${name || 'Developer'}!`,
    html: htmlContent,
  });
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

/**
 * Send Contributor Application Approved notification email
 */
export async function sendContributorApprovedEmail(
  toEmail: string,
  name: string
): Promise<boolean> {
  const mailTransporter = getEmailTransporter();
  const studioUrl = `${config.clientUrl}/admin/blogs/new`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
          .container { max-width: 560px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 18px; overflow: hidden; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.6); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%); padding: 28px 24px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); color: #fbbf24; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 8px; margin-bottom: 12px; }
          .title { color: #ffffff; font-size: 20px; font-weight: 800; margin: 0 0 14px 0; }
          .box { background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; font-size: 13px; color: #fde68a; line-height: 1.6; }
          .btn-container { text-align: center; margin: 24px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #090d16 !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 30px; border-radius: 10px; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35); }
          .footer { background: #0b0f19; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ Code & Coffee • Author Guild</h1>
          </div>
          <div class="content">
            <span class="badge">Application Approved</span>
            <h2 class="title">Welcome to the Author Guild, ${name}!</h2>
            <p style="font-size: 14px; color: #d1d5db; line-height: 1.6;">
              Great news! Your application to become a publisher/contributor on Code &amp; Coffee has been approved by the editorial staff.
            </p>
            <div class="box">
              You now have contributor permissions to write, draft, edit, and publish your own technical deep-dives in the Author Studio!
            </div>
            <div class="btn-container">
              <a href="${studioUrl}" class="btn" target="_blank">Open Author Studio &rarr;</a>
            </div>
          </div>
          <div class="footer">
            Code &amp; Coffee • Khejuri, East Medinipur, West Bengal, India, 721430
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: '🎉 Congratulations! You are now a Contributor on Code & Coffee',
    html: htmlContent,
  });
}

/**
 * Send notification to Admin when a new contact inquiry is submitted
 */
export async function sendAdminNewInquiryNotificationEmail(inquiry: {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
}): Promise<boolean> {
  const mailTransporter = getEmailTransporter();
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    (config.initialAdmin.email && !config.initialAdmin.email.includes('codeandcoffee.dev')
      ? config.initialAdmin.email
      : 'dasramesh8343003905@gmail.com');
  const inquiriesUrl = `${config.clientUrl}/admin/inquiries`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 18px; overflow: hidden; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.6); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%); padding: 24px 28px; text-align: left; }
          .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); color: #fbbf24; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 8px; margin-bottom: 16px; }
          .field { margin-bottom: 14px; font-size: 13px; color: #9ca3af; }
          .field strong { color: #ffffff; font-weight: 600; }
          .message-box { background: #0b0f19; border: 1px solid #1f2937; border-left: 4px solid #f59e0b; padding: 18px; border-radius: 8px; margin: 18px 0; font-size: 14px; color: #e5e7eb; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
          .btn-container { text-align: center; margin: 28px 0 10px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #090d16 !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 32px; border-radius: 10px; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35); }
          .footer { background: #0b0f19; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 Code &amp; Coffee • New User Inquiry</h1>
          </div>
          <div class="content">
            <span class="badge">Action Required • Pending Inquiry</span>
            <div class="field"><strong>Sender:</strong> ${inquiry.name} (<a href="mailto:${inquiry.email}" style="color: #fbbf24;">${inquiry.email}</a>)</div>
            <div class="field"><strong>Subject:</strong> ${inquiry.subject}</div>
            <div class="field"><strong>Submitted:</strong> ${new Date(inquiry.createdAt).toLocaleString()}</div>
            <div class="message-box">${inquiry.message}</div>
            <div class="btn-container">
              <a href="${inquiriesUrl}" class="btn" target="_blank">Open Inquiry in Admin Panel &rarr;</a>
            </div>
          </div>
          <div class="footer">
            Admin Notification • Code &amp; Coffee Technical Journal
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    replyTo: inquiry.email,
    subject: `📬 [New Inquiry] ${inquiry.subject} (from ${inquiry.name})`,
    html: htmlContent,
  });
}

/**
 * Send inquiry resolution email to user with custom admin response body
 */
export async function sendInquiryResolvedUserEmail({
  toEmail,
  name,
  subject,
  adminReply,
  originalMessage,
}: {
  toEmail: string;
  name: string;
  subject: string;
  adminReply: string;
  originalMessage: string;
}): Promise<boolean> {
  const exploreUrl = `${config.clientUrl}/blogs`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 18px; overflow: hidden; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.6); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 24px 28px; text-align: left; }
          .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 8px; margin-bottom: 16px; }
          .title { color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 12px 0; }
          .greeting { font-size: 14px; color: #d1d5db; line-height: 1.6; margin-bottom: 16px; }
          .admin-reply-box { background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-left: 4px solid #f59e0b; padding: 20px; border-radius: 10px; margin: 20px 0; font-size: 14px; color: #ffffff; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
          .original-quote { background: #0b0f19; border: 1px solid #1f2937; padding: 14px 18px; border-radius: 8px; margin: 18px 0; font-size: 12px; color: #9ca3af; line-height: 1.5; }
          .btn-container { text-align: center; margin: 24px 0 10px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #090d16 !important; font-weight: 800; font-size: 13px; text-decoration: none; padding: 10px 26px; border-radius: 8px; }
          .footer { background: #0b0f19; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>☕ Code &amp; Coffee • Inquiry Resolved</h1>
          </div>
          <div class="content">
            <span class="badge">Inquiry Resolved</span>
            <h2 class="title">Response Regarding: ${subject}</h2>
            <p class="greeting">Hi ${name},<br/><br/>Our engineering administration team has reviewed and resolved your inquiry. Please find our response below:</p>
            <div class="admin-reply-box">
              <strong>Admin Response:</strong><br/>
              ${adminReply}
            </div>
            <div class="original-quote">
              <strong style="color: #6b7280;">Your original message:</strong><br/>
              ${originalMessage}
            </div>
            <p style="font-size: 13px; color: #9ca3af; margin-top: 20px;">
              If you have any further questions or follow-up topics, feel free to reply directly to this email or submit another inquiry through our platform.
            </p>
            <div class="btn-container">
              <a href="${exploreUrl}" class="btn" target="_blank">Explore Code &amp; Coffee &rarr;</a>
            </div>
          </div>
          <div class="footer">
            Code &amp; Coffee Engineering Journal • Khejuri, East Medinipur, West Bengal, India, 721430
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `☕ Response to your inquiry: ${subject}`,
    html: htmlContent,
  });
}

/**
 * Send security alert when a login from an unrecognized/new device is detected
 */
export async function sendNewDeviceLoginAlertEmail({
  toEmail,
  name,
  deviceType,
  browser,
  os,
  ipAddress,
  time,
}: {
  toEmail: string;
  name: string;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress: string;
  time: Date;
}): Promise<boolean> {
  const securityUrl = `${config.clientUrl}/user/profile`;
  const resetPasswordUrl = `${config.clientUrl}/auth/forgot-password`;
  const formattedTime = time.toUTCString();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 18px; overflow: hidden; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.6); }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%); padding: 26px 28px; text-align: left; }
          .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 8px; margin-bottom: 16px; }
          .title { color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 12px 0; }
          .greeting { font-size: 14px; color: #d1d5db; line-height: 1.6; margin-bottom: 18px; }
          .info-table { width: 100%; border-collapse: collapse; margin: 18px 0; background: #0b0f19; border: 1px solid #1f2937; border-radius: 10px; overflow: hidden; }
          .info-table td { padding: 12px 16px; border-bottom: 1px solid #1f2937; font-size: 13px; color: #9ca3af; }
          .info-table td strong { color: #ffffff; font-weight: 600; }
          .info-table tr:last-child td { border-bottom: none; }
          .warning-box { background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: 0 8px 8px 0; padding: 16px; margin: 20px 0; font-size: 13px; color: #fca5a5; line-height: 1.6; }
          .btn-container { text-align: center; margin: 26px 0 10px 0; display: flex; justify-content: center; gap: 12px; }
          .btn-danger { display: inline-block; background: #ef4444; color: #ffffff !important; font-weight: 700; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 10px; }
          .btn-outline { display: inline-block; background: transparent; border: 1px solid #374151; color: #d1d5db !important; font-weight: 600; font-size: 13px; text-decoration: none; padding: 12px 20px; border-radius: 10px; }
          .footer { background: #0b0f19; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ Code &amp; Coffee • Security Alert</h1>
          </div>
          <div class="content">
            <span class="badge">New Device Sign-In Detected</span>
            <h2 class="title">New login to your account</h2>
            <p class="greeting">Hi ${name || 'Developer'},<br/>We detected a login to your Code &amp; Coffee account from a new or unrecognized device:</p>
            
            <table class="info-table">
              <tr>
                <td>Device &amp; Browser</td>
                <td><strong>${browser} on ${os} (${deviceType})</strong></td>
              </tr>
              <tr>
                <td>IP Address</td>
                <td><strong>${ipAddress}</strong></td>
              </tr>
              <tr>
                <td>Date &amp; Time</td>
                <td><strong>${formattedTime}</strong></td>
              </tr>
            </table>

            <div class="warning-box">
              <strong>Was this you?</strong> If you recently logged in from this browser or device, you can safely disregard this message.
              <br/><br/>
              <strong>If this wasn't you:</strong> Someone else may have accessed your account. We strongly recommend resetting your password immediately and terminating all other active sessions from your profile.
            </div>

            <div class="btn-container">
              <a href="${securityUrl}" class="btn-danger" target="_blank">Review Devices &amp; Sessions</a>
              <a href="${resetPasswordUrl}" class="btn-outline" target="_blank">Reset Password</a>
            </div>
          </div>
          <div class="footer">
            Code &amp; Coffee Security Infrastructure • Khejuri, East Medinipur, West Bengal, India, 721430
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `🛡️ [Security Alert] New sign-in detected on ${browser} (${os})`,
    html: htmlContent,
  });
}

/**
 * Send notification when account deletion is requested (with 15-day cool-off period)
 */
export async function sendAccountDeletionScheduledEmail({
  toEmail,
  name,
  scheduledDate,
}: {
  toEmail: string;
  name: string;
  scheduledDate: Date;
}): Promise<boolean> {
  const recoveryUrl = `${config.clientUrl}/user/profile`;
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 18px; overflow: hidden; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.6); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%); padding: 26px 28px; text-align: left; }
          .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #fbbf24; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 8px; margin-bottom: 16px; }
          .title { color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 12px 0; }
          .notice-box { background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b; padding: 18px; border-radius: 0 8px 8px 0; margin: 20px 0; font-size: 14px; color: #fde68a; line-height: 1.6; }
          .date-badge { display: inline-block; background: #1f2937; border: 1px solid #374151; color: #ffffff; font-weight: 700; font-size: 15px; padding: 8px 16px; border-radius: 8px; margin: 10px 0; }
          .btn-container { text-align: center; margin: 28px 0 10px 0; }
          .btn-primary { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 30px; border-radius: 10px; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); }
          .footer { background: #0b0f19; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏳ Code &amp; Coffee • Account Deletion Notice</h1>
          </div>
          <div class="content">
            <span class="badge">15-Day Cool-off Period Active</span>
            <h2 class="title">Your account deletion is scheduled</h2>
            <p style="font-size: 14px; color: #d1d5db; line-height: 1.6;">
              Hello ${name || 'Developer'},<br/>
              We have received a request to permanently delete your Code &amp; Coffee account. In accordance with our security and data recovery policies, we provide a <strong>15-day cooling period</strong> before any permanent data erasure occurs.
            </p>

            <div class="notice-box">
              Scheduled Permanent Deletion Date:<br/>
              <div class="date-badge">${formattedDate}</div>
              <br/>
              During this 15-day window, your profile and comments will be placed in pending deletion state.
            </div>

            <p style="font-size: 14px; color: #d1d5db; line-height: 1.6;">
              <strong>Changed your mind?</strong><br/>
              You can cancel this request and restore your account immediately at any time during the 15 days simply by signing in and clicking <em>"Restore Account"</em> in your profile banner.
            </p>

            <div class="btn-container">
              <a href="${recoveryUrl}" class="btn-primary" target="_blank">Restore / Recover Account &rarr;</a>
            </div>
          </div>
          <div class="footer">
            Code &amp; Coffee Account Protection • Khejuri, East Medinipur, West Bengal, India, 721430
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `⏳ [Action Required] Account deletion scheduled (15-day recovery period active)`,
    html: htmlContent,
  });
}

/**
 * Send confirmation when an account deletion request is cancelled / restored
 */
export async function sendAccountRecoveredEmail({
  toEmail,
  name,
}: {
  toEmail: string;
  name: string;
}): Promise<boolean> {
  const profileUrl = `${config.clientUrl}/user/profile`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 18px; overflow: hidden; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.6); }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 26px 28px; text-align: left; }
          .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 8px; margin-bottom: 16px; }
          .title { color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 12px 0; }
          .btn-container { text-align: center; margin: 26px 0 10px 0; }
          .btn-primary { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #090d16 !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 30px; border-radius: 10px; }
          .footer { background: #0b0f19; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Code &amp; Coffee • Account Restored</h1>
          </div>
          <div class="content">
            <span class="badge">Account Active &amp; Protected</span>
            <h2 class="title">Deletion request successfully cancelled</h2>
            <p style="font-size: 14px; color: #d1d5db; line-height: 1.6;">
              Hello ${name || 'Developer'},<br/><br/>
              Your account deletion request has been cancelled, and your account has been fully restored to active status. Your publications, bookmarks, comments, and profile remain completely intact.
            </p>
            <div class="btn-container">
              <a href="${profileUrl}" class="btn-primary" target="_blank">Go to Profile &rarr;</a>
            </div>
          </div>
          <div class="footer">
            Code &amp; Coffee • Khejuri, East Medinipur, West Bengal, India, 721430
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `✅ Your Code & Coffee account deletion has been cancelled`,
    html: htmlContent,
  });
}

/**
 * Send password reset direct email with both OTP verification code and 1-click reset URL
 */
export async function sendPasswordResetDirectEmail({
  toEmail,
  name,
  otpCode,
  resetUrl,
}: {
  toEmail: string;
  name: string;
  otpCode: string;
  resetUrl: string;
}): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
          .container { max-width: 540px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 18px; overflow: hidden; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.6); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%); padding: 28px 24px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; }
          .content { padding: 32px 28px; text-align: center; }
          .greeting { font-size: 15px; color: #d1d5db; margin-bottom: 20px; }
          .otp-badge { display: inline-block; background: #1f2937; border: 2px dashed #f59e0b; color: #fbbf24; font-size: 30px; font-weight: 800; letter-spacing: 6px; padding: 14px 28px; border-radius: 12px; margin: 18px 0; }
          .btn-container { text-align: center; margin: 26px 0 14px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #090d16 !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 13px 32px; border-radius: 12px; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3); }
          .info { color: #9ca3af; font-size: 13px; line-height: 1.6; margin-top: 18px; }
          .footer { background: #0b0f19; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset Request</h1>
          </div>
          <div class="content">
            <p class="greeting">Hi ${name || 'Developer'},<br/>You requested to reset your password directly from your account profile.</p>
            <p style="font-size: 13px; color: #9ca3af; margin: 0;">Use the 6-digit one-time code below:</p>
            <div class="otp-badge">${otpCode}</div>
            <div class="btn-container">
              <a href="${resetUrl}" class="btn" target="_blank">Reset Password Directly &rarr;</a>
            </div>
            <p class="info">
              This code and link will expire in <strong>10 minutes</strong>.<br/>
              If you did not request this password reset, please ensure your account is secure.
            </p>
          </div>
          <div class="footer">
            Code &amp; Coffee Security Infrastructure • Khejuri, East Medinipur, West Bengal, India, 721430
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: toEmail,
    subject: `🔒 [Code & Coffee] Password Reset Instructions & Code`,
    html: htmlContent,
  });
}

/**
 * Send notification to Admin when a user joins the What's Coming VIP Waitlist
 */
export async function sendAdminWaitlistNotificationEmail({
  name,
  email,
  track,
  notes,
}: {
  name: string;
  email: string;
  track: string;
  notes?: string | null;
}): Promise<boolean> {
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    (config.initialAdmin.email && !config.initialAdmin.email.includes('codeandcoffee.dev')
      ? config.initialAdmin.email
      : 'dasramesh8343003905@gmail.com');
  const waitlistDashboardUrl = `${config.clientUrl}/admin/waitlist`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 18px; overflow: hidden; box-shadow: 0 15px 35px -5px rgba(0,0,0,0.6); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%); padding: 24px 28px; text-align: left; }
          .header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); color: #fbbf24; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 8px; margin-bottom: 16px; }
          .field { margin-bottom: 14px; font-size: 13px; color: #9ca3af; }
          .field strong { color: #ffffff; font-weight: 600; }
          .track-box { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 18px 0; font-size: 14px; color: #fde68a; font-weight: 700; }
          .btn-container { text-align: center; margin: 28px 0 10px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #090d16 !important; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 32px; border-radius: 10px; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.35); }
          .footer { background: #0b0f19; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 Code &amp; Coffee • Early Access Waitlist</h1>
          </div>
          <div class="content">
            <span class="badge">Job-Ready Platform Notification</span>
            <div class="field"><strong>Developer:</strong> ${name} (<a href="mailto:${email}" style="color: #fbbf24;">${email}</a>)</div>
            <div class="field"><strong>Registered At:</strong> ${new Date().toLocaleString()}</div>
            <div class="track-box">Requested Track: ${track}</div>
            ${notes ? `<div class="field"><strong>Notes:</strong> ${notes}</div>` : ''}
            <div class="btn-container">
              <a href="${waitlistDashboardUrl}" class="btn" target="_blank">View in Waitlist Dashboard &rarr;</a>
            </div>
          </div>
          <div class="footer">
            Administrator Telemetry • Code &amp; Coffee Engineering Journal
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    replyTo: email,
    subject: `🚀 [VIP Waitlist] ${name} requested early access for: ${track}`,
    html: htmlContent,
  });
}


