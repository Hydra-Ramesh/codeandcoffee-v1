import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const backupsDir = path.join(__dirname, '../backups');

if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

async function runBackup() {
  console.log('🚀 [Database Backup Engine] Initiating automated database snapshot...');
  const startTime = Date.now();

  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Extract all relational tables in dependency order
    const [users, posts, comments, applications, likes, dislikes] = await Promise.all([
      prisma.user.findMany(),
      prisma.post.findMany(),
      prisma.comment.findMany(),
      prisma.contributorApplication.findMany(),
      prisma.like.findMany(),
      prisma.dislike.findMany(),
    ]);

    const backupPayload = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      databaseEngine: 'Neon PostgreSQL (Prisma ORM)',
      counts: {
        users: users.length,
        posts: posts.length,
        comments: comments.length,
        applications: applications.length,
        likes: likes.length,
        dislikes: dislikes.length,
      },
      data: {
        users,
        posts,
        comments,
        applications,
        likes,
        dislikes,
      },
    };

    const serializedData = JSON.stringify(backupPayload, null, 2);
    const checksum = crypto.createHash('sha256').update(serializedData).digest('hex');
    backupPayload.checksum = checksum;

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `db-snapshot-${timestampStr}.json`;
    const filePath = path.join(backupsDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupPayload, null, 2), 'utf-8');
    const fileSizeMb = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(3);

    console.log(`✅ [Database Backup Engine] Snapshot completed in ${Date.now() - startTime}ms`);
    console.log(`📁 File: ${fileName} (${fileSizeMb} MB)`);
    console.log(`🔐 SHA256 Integrity: ${checksum}`);
    console.log('📊 Records Saved:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Posts/Blogs: ${posts.length}`);
    console.log(`   - Comments: ${comments.length}`);
    console.log(`   - Contributor Applications: ${applications.length}`);

    // Prune backups older than 14 days
    const files = fs.readdirSync(backupsDir);
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (file.startsWith('db-snapshot-') && file.endsWith('.json')) {
        const fullPath = path.join(backupsDir, file);
        const stats = fs.statSync(fullPath);
        if (stats.mtimeMs < fourteenDaysAgo) {
          fs.unlinkSync(fullPath);
          console.log(`🧹 Pruned expired backup: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ [Database Backup Engine] Backup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runBackup();
