import { redisClient } from '../config/redis.js';
import { prisma } from '../config/database.js';

const BUFFER_KEY = 'buffer:blog:views';
let flushTimer: NodeJS.Timeout | null = null;
let isFlushing = false;

// Local in-memory view buffer (0 Redis commands consumed for single-server setups)
const localPendingViews = new Map<string, number>();

export class ViewBufferService {
  /**
   * Buffer a view increment in memory (and optionally Redis if REDIS_CLUSTER_MODE is active)
   * Runs in microseconds without locking PostgreSQL rows or consuming Upstash commands
   */
  static async recordView(blogId: string): Promise<number> {
    const current = (localPendingViews.get(blogId) || 0) + 1;
    localPendingViews.set(blogId, current);

    // Only mirror to Redis if horizontal cluster mode is explicitly turned on
    if (process.env.REDIS_CLUSTER_MODE === 'true') {
      try {
        await redisClient.hincrby(BUFFER_KEY, blogId, 1);
      } catch (err) {
        console.warn(`[ViewBuffer] Remote Redis buffer notice for ${blogId}:`, (err as Error).message);
      }
    }

    return current;
  }

  /**
   * Get current buffered pending views for a post
   */
  static async getBufferedViews(blogId: string): Promise<number> {
    const local = localPendingViews.get(blogId) || 0;
    if (process.env.REDIS_CLUSTER_MODE === 'true') {
      try {
        const all = await redisClient.hgetall(BUFFER_KEY);
        const val = all[blogId];
        return Math.max(local, val ? parseInt(val, 10) || 0 : 0);
      } catch {
        return local;
      }
    }
    return local;
  }

  /**
   * Batch retrieval of buffered views for multiple posts in a single lookup
   */
  static async getBatchBufferedViews(blogIds: string[]): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    let remoteMap: Record<string, string> = {};

    if (process.env.REDIS_CLUSTER_MODE === 'true' && blogIds.length > 0) {
      try {
        remoteMap = await redisClient.hgetall(BUFFER_KEY);
      } catch {}
    }

    for (const id of blogIds) {
      const local = localPendingViews.get(id) || 0;
      const remote = remoteMap[id] ? parseInt(remoteMap[id], 10) || 0 : 0;
      map.set(id, Math.max(local, remote));
    }

    return map;
  }

  /**
   * Consolidated batch write: flush all accumulated views to PostgreSQL
   * Reduces PostgreSQL write load by up to 99% and eliminates idle Redis polling
   */
  static async flushBufferedViews(): Promise<void> {
    if (isFlushing) return;

    // Check if we have anything to flush
    if (localPendingViews.size === 0 && process.env.REDIS_CLUSTER_MODE !== 'true') {
      // Nothing pending! Zero database and zero Redis operations consumed.
      return;
    }

    isFlushing = true;

    try {
      // Snapshot pending local views and clear map for new incoming views
      const snapshot = new Map(localPendingViews);
      localPendingViews.clear();

      // If cluster mode is enabled, merge remote Redis hash
      if (process.env.REDIS_CLUSTER_MODE === 'true') {
        try {
          const allViews = await redisClient.hgetall(BUFFER_KEY);
          for (const [id, countStr] of Object.entries(allViews)) {
            const count = parseInt(countStr, 10) || 0;
            if (count > 0) {
              snapshot.set(id, (snapshot.get(id) || 0) + count);
            }
          }
        } catch (err) {
          console.warn('[ViewBuffer] Redis view fetch notice during flush:', (err as Error).message);
        }
      }

      if (snapshot.size === 0) {
        return;
      }

      let totalViewsFlushed = 0;

      for (const [blogId, count] of snapshot.entries()) {
        if (count <= 0) continue;

        try {
          await prisma.post.update({
            where: { id: blogId },
            data: { views: { increment: count } },
          });

          if (process.env.REDIS_CLUSTER_MODE === 'true') {
            await redisClient.hdel(BUFFER_KEY, blogId);
          }
          totalViewsFlushed += count;
        } catch (updateErr) {
          console.warn(`[ViewBuffer] Failed to flush views to post ${blogId}:`, (updateErr as Error).message);
          // Re-queue failed views back into local map
          localPendingViews.set(blogId, (localPendingViews.get(blogId) || 0) + count);
        }
      }

      if (totalViewsFlushed > 0) {
        console.log(`🚀 [ViewBuffer] Batch write complete: flushed ${totalViewsFlushed} views across ${snapshot.size} posts to PostgreSQL.`);
      }
    } catch (err) {
      console.error('[ViewBuffer] Flush cycle error:', (err as Error).message);
    } finally {
      isFlushing = false;
    }
  }

  /**
   * Initialize recurring background flush interval (default: every 5 minutes / 300,000ms)
   * and graceful shutdown handlers
   */
  static startFlushInterval(intervalMs: number = 300000) {
    if (flushTimer) return;

    flushTimer = setInterval(() => {
      this.flushBufferedViews().catch((e) => {
        console.error('[ViewBuffer] Scheduled flush error:', e);
      });
    }, intervalMs);

    // Ensure buffered views are persisted before process exits
    const onExit = async () => {
      if (flushTimer) clearInterval(flushTimer);
      console.log('⏳ [ViewBuffer] Flushing remaining buffered views before shutdown...');
      await this.flushBufferedViews();
    };

    process.once('SIGINT', onExit);
    process.once('SIGTERM', onExit);

    console.log(`⚡ [ViewBuffer] High-performance batch view buffer active (Flush interval: ${intervalMs / 1000}s, Zero idle Redis polling).`);
  }
}
