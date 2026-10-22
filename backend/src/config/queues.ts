import { Queue, Worker, Job } from 'bullmq';
import { config } from './env.js';
import { sendOtpEmail } from './email.js';

interface EmailJobData {
  toEmail: string;
  otpCode: string;
  name?: string;
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
          console.log(`🚀 [BullMQ] Processing email job #${job.id} for: ${job.data.toEmail}`);
          await sendOtpEmail(job.data.toEmail, job.data.otpCode, job.data.name);
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

export async function queueOtpEmail(toEmail: string, otpCode: string, name?: string): Promise<void> {
  if (emailQueue) {
    try {
      await emailQueue.add('send-otp', { toEmail, otpCode, name }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
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
      console.error('Error sending direct email:', e);
    }
  });
}
