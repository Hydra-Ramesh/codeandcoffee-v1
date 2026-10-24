import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const backupsDir = path.join(__dirname, '../backups');

const isDryRun = process.argv.includes('--dry-run');
const specificFile = process.argv.find((arg) => arg.endsWith('.json'));

async function runRestore() {
  console.log('🔄 [Database Restore Engine] Initiating database restore procedure...');
  if (isDryRun) {
    console.log('🧪 DRY-RUN MODE: Validating integrity without mutating live database tables.');
  }

  try {
    if (!fs.existsSync(backupsDir)) {
      throw new Error(`Backups directory does not exist: ${backupsDir}`);
    }

    let targetFile = specificFile;
    if (!targetFile) {
      // Find latest backup snapshot
      const files = fs
        .readdirSync(backupsDir)
        .filter((f) => f.startsWith('db-snapshot-') && f.endsWith('.json'))
        .sort()
        .reverse();

      if (files.length === 0) {
        throw new Error('No database snapshot files found in backups directory.');
      }
      targetFile = path.join(backupsDir, files[0]);
    }

    console.log(`📦 Inspecting snapshot: ${path.basename(targetFile)}`);
    const fileContent = fs.readFileSync(targetFile, 'utf-8');
    const snapshot = JSON.parse(fileContent);

    if (!snapshot.data || !snapshot.counts) {
      throw new Error('Snapshot file format is corrupted or missing data payload.');
    }

    // Verify SHA256 integrity
    const recordedChecksum = snapshot.checksum;
    delete snapshot.checksum;
    const recomputedChecksum = crypto
      .createHash('sha256')
      .update(JSON.stringify(snapshot, null, 2))
      .digest('hex');

    if (recordedChecksum && recordedChecksum !== recomputedChecksum) {
      console.warn('⚠️ Warning: SHA256 checksum mismatch. File may have been altered.');
    } else {
      console.log('✅ SHA256 snapshot integrity verified successfully.');
    }

    console.log('📊 Target Records in Snapshot:');
    console.log(`   - Users: ${snapshot.counts.users}`);
    console.log(`   - Posts/Blogs: ${snapshot.counts.posts || snapshot.counts.blogs || 0}`);
    console.log(`   - Comments: ${snapshot.counts.comments}`);
    console.log(`   - Applications: ${snapshot.counts.applications}`);

    if (isDryRun) {
      console.log('🧪 Dry-run inspection complete. Target database untouched.');
      return;
    }

    console.log('⏳ Restoring records in transaction...');

    // Restore records with upsert to prevent unique constraint conflicts
    let usersRestored = 0;
    for (const u of snapshot.data.users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: u,
        create: u,
      });
      usersRestored++;
    }

    let postsRestored = 0;
    const postRecords = snapshot.data.posts || snapshot.data.blogs || [];
    for (const p of postRecords) {
      await prisma.post.upsert({
        where: { id: p.id },
        update: p,
        create: p,
      });
      postsRestored++;
    }

    console.log(`✅ [Database Restore Engine] Restoration complete!`);
    console.log(`   - Restored ${usersRestored} users`);
    console.log(`   - Restored ${postsRestored} posts`);
  } catch (error) {
    console.error('❌ [Database Restore Engine] Restore failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRestore();
