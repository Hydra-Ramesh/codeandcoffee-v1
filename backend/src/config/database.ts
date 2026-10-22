import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import { config } from './env.js';

// Initialize Prisma Client for Neon PostgreSQL
let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    log: config.nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
} catch (error) {
  console.warn('⚠️ Prisma Client initialization notice:', (error as Error).message);
  prisma = new PrismaClient();
}

export { prisma };

// Connect to MongoDB Atlas (for blog revisions, rich drafts and archive)
export async function connectMongo(): Promise<void> {
  if (!config.mongodbUri || config.mongodbUri.includes('demo:demo')) {
    console.log('ℹ️ MongoDB Atlas URI is using demo placeholder. Running in hybrid/graceful mode.');
    return;
  }

  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB Atlas successfully.');
  } catch (error) {
    console.warn('⚠️ MongoDB Atlas connection skipped or unreachable:', (error as Error).message);
    console.log('ℹ️ App will continue utilizing Neon Postgres for core data.');
  }
}

// MongoDB schema for Blog Draft Revisions & Extended Analytics
const blogRevisionSchema = new mongoose.Schema(
  {
    blogSlug: { type: String, required: true, index: true },
    authorEmail: { type: String, required: true },
    title: { type: String, required: true },
    contentMarkdown: { type: String, required: true },
    metaTags: [String],
    revisionNumber: { type: Number, default: 1 },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const BlogRevision = mongoose.models.BlogRevision || mongoose.model('BlogRevision', blogRevisionSchema);
