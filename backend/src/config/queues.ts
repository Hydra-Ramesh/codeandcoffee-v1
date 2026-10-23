import { Queue, Worker, Job } from 'bullmq';
import { config } from './env.js';
import { sendOtpEmail, sendWelcomeEmail, sendNewBlogNotificationEmail, sendContributorApprovedEmail, BlogBroadcastData } from './email.js';
import { prisma } from './database.js';

type EmailJobType = 'otp' | 'welcome' | 'new-blog' | 'contributor-approved';

interface EmailJobData {
  type: EmailJobType;
  toEmail: string;
  name?: string;
  otpCode?: string;
  blogData?: BlogBroadcastData;
}

let emailQueue: Queue<EmailJobData> | null = null;
let emailWorker: Worker<EmailJobData> | null = null;

// Initialize BullMQ if standard Redis is available, or use direct async dispatcher
export function setupQueues() {
  const isRedisConfigured = config.redisUrl && !config.redisUrl.includes('localhost:6379');

  if (isRedisConfigured) {
    try {
      const connection = {
        url: config.redisUrl,
      };

      emailQueue = new Queue<EmailJobData>('email-queue', { connection });

      emailWorker = new Worker<EmailJobData>(
        'email-queue',
        async (job: Job<EmailJobData>) => {
          const { type, toEmail, name, otpCode, blogData } = job.data;
          console.log(`🚀 [BullMQ] Processing ${type} email job #${job.id} for: ${toEmail}`);

          if (type === 'otp' && otpCode) {
            await sendOtpEmail(toEmail, otpCode, name);
          } else if (type === 'welcome') {
            await sendWelcomeEmail(toEmail, name || 'Developer');
          } else if (type === 'new-blog' && blogData) {
            await sendNewBlogNotificationEmail(toEmail, name || 'Reader', blogData);
          } else if (type === 'contributor-approved') {
            await sendContributorApprovedEmail(toEmail, name || 'Contributor');
          }
        },
        { connection }
      );

      emailWorker.on('completed', (job) => {
        console.log(`✅ [BullMQ] Email job #${job.id} completed!`);
      });

      emailWorker.on('failed', (job, err) => {
        console.error(`❌ [BullMQ] Email job #${job?.id} failed:`, err.message);
      });

      console.log('✅ BullMQ Email Queue & Worker initialized.');
    } catch (err) {
      console.warn('⚠️ BullMQ init warning, falling back to instant async dispatch:', (err as Error).message);
    }
  } else {
    console.log('ℹ️ Running BullMQ dispatcher in fast direct-async mode (No remote Redis queue needed).');
  }
}

/**
 * Queue a 6-digit OTP verification email
 */
export async function queueOtpEmail(toEmail: string, otpCode: string, name?: string): Promise<void> {
  if (emailQueue) {
    try {
      await emailQueue.add(
        'send-otp',
        { type: 'otp', toEmail, otpCode, name },
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
      );
      return;
    } catch (err) {
      console.warn('⚠️ BullMQ enqueue failed, executing directly:', (err as Error).message);
    }
  }

  // Fallback: direct asynchronous dispatch
  setImmediate(async () => {
    try {
      await sendOtpEmail(toEmail, otpCode, name);
    } catch (e) {
      console.error('Error sending direct OTP email:', e);
    }
  });
}

/**
 * Queue a Welcome registration email for newly registered users
 */
export async function queueWelcomeEmail(toEmail: string, name: string): Promise<void> {
  if (emailQueue) {
    try {
      await emailQueue.add(
        'send-welcome',
        { type: 'welcome', toEmail, name },
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
      );
      return;
    } catch (err) {
      console.warn('⚠️ BullMQ enqueue failed, executing directly:', (err as Error).message);
    }
  }

  // Fallback: direct asynchronous dispatch
  setImmediate(async () => {
    try {
      await sendWelcomeEmail(toEmail, name);
    } catch (e) {
      console.error('Error sending direct welcome email:', e);
    }
  });
}

/**
 * Queue a Contributor Application Approval congratulatory email
 */
export async function queueContributorApprovedEmail(toEmail: string, name: string): Promise<void> {
  if (emailQueue) {
    try {
      await emailQueue.add(
        'send-contributor-approved',
        { type: 'contributor-approved', toEmail, name },
        { attempts: 3, backoff: { type: 'exponential', delay: 1000 } }
      );
      return;
    } catch (err) {
      console.warn('⚠️ BullMQ enqueue failed, executing directly:', (err as Error).message);
    }
  }

  // Fallback: direct asynchronous dispatch
  setImmediate(async () => {
    try {
      await sendContributorApprovedEmail(toEmail, name);
    } catch (e) {
      console.error('Error sending direct contributor approval email:', e);
    }
  });
}

/**
 * Broadcast an email notification to all registered users when admin publishes a new blog
 */
export async function queueNewBlogBroadcast(blogData: BlogBroadcastData): Promise<void> {
  console.log(`📢 Initiating new blog email broadcast for: "${blogData.title}"`);

  setImmediate(async () => {
    try {
      // Fetch all active, non-banned registered users
      const users = await prisma.user.findMany({
        where: { isBanned: false },
        select: { email: true, name: true },
      });

      console.log(`📬 Found ${users.length} active registered users to notify for new blog.`);

      for (const user of users) {
        if (!user.email) continue;

        if (emailQueue) {
          try {
            await emailQueue.add(
              'send-new-blog',
              {
                type: 'new-blog',
                toEmail: user.email,
                name: user.name,
                blogData,
              },
              { attempts: 3, backoff: { type: 'exponential', delay: 1500 } }
            );
            continue;
          } catch (queueErr) {
            console.warn(`BullMQ queue failed for ${user.email}, falling back to direct send:`, queueErr);
          }
        }

        // Direct async send fallback with slight pause to respect Google SMTP rate limits
        try {
          await sendNewBlogNotificationEmail(user.email, user.name, blogData);
          // Wait 250ms between sends to stay well within Google SMTP limits
          await new Promise((resolve) => setTimeout(resolve, 250));
        } catch (sendErr) {
          console.error(`Failed to send new blog email to ${user.email}:`, (sendErr as Error).message);
        }
      }

      console.log(`✅ Broadcast complete for "${blogData.title}"`);
    } catch (err) {
      console.error('❌ Failed processing blog email broadcast:', (err as Error).message);
    }
  });
}
