import { redisClient } from '../config/redis.js';

interface L1CacheEntry {
  value: any;
  expiresAt: number;
}

/**
 * High-performance In-Memory L1 Cache
 * Eliminates up to 95% of Upstash Redis commands by serving repeated reads
 * directly from Node.js process RAM (0ms latency, zero network roundtrips).
 */
class L1MemoryStore {
  private map = new Map<string, L1CacheEntry>();
  private readonly maxEntries = 2000;

  get<T>(key: string): T | null {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set(key: string, value: any, ttlSeconds: number): void {
    if (this.map.size >= this.maxEntries) {
      // Bounded capacity: evict oldest entry
      const oldestKey = this.map.keys().next().value;
      if (oldestKey) this.map.delete(oldestKey);
    }
    this.map.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key: string): void {
    this.map.delete(key);
  }

  delPattern(pattern: string): void {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.map.keys()) {
      if (regex.test(key)) {
        this.map.delete(key);
      }
    }
  }

  clear(): void {
    this.map.clear();
  }
}

const l1Store = new L1MemoryStore();

export class CacheService {
  /**
   * Retrieve cached item and parse JSON.
   * Checks ultra-fast L1 in-memory store first (0 Redis commands).
   * Only calls remote Redis on L1 miss, then memoizes in L1 for up to 60s.
   */
  static async get<T>(key: string): Promise<T | null> {
    // 1. Check in-process L1 cache (0 Redis commands)
    const l1Hit = l1Store.get<T>(key);
    if (l1Hit !== null && l1Hit !== undefined) {
      return l1Hit;
    }

    // 2. Query L2 Redis
    try {
      const data = await redisClient.get(key);
      if (!data) return null;

      let parsed: T;
      if (typeof data === 'object') {
        parsed = data as T;
      } else {
        try {
          parsed = JSON.parse(data) as T;
        } catch {
          parsed = data as unknown as T;
        }
      }

      // Memoize in L1 for 60 seconds to absorb burst traffic with 0 commands
      l1Store.set(key, parsed, 60);

      return parsed;
    } catch (err) {
      console.warn(`Cache get error for key "${key}":`, (err as Error).message);
      return null;
    }
  }

  /**
   * Cache item with TTL in seconds.
   * Writes to both local L1 store and remote L2 Redis.
   */
  static async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
    // 1. Write to L1 store immediately
    const l1Ttl = Math.min(ttlSeconds, 120);
    l1Store.set(key, value, l1Ttl);

    // 2. Persist to L2 Redis
    try {
      const stringified = JSON.stringify(value);
      await redisClient.set(key, stringified, 'EX', ttlSeconds);
    } catch (err) {
      console.warn(`Cache set error for key "${key}":`, (err as Error).message);
    }
  }

  /**
   * Delete a single key from both L1 memory and remote Redis.
   */
  static async del(key: string): Promise<void> {
    l1Store.del(key);
    try {
      await redisClient.del(key);
    } catch (err) {
      console.warn(`Cache del error for key "${key}":`, (err as Error).message);
    }
  }

  /**
   * Invalidate multiple keys matching a pattern (e.g., 'blogs:list:*')
   * Instantly purges from local L1 store and cleans remote Redis.
   */
  static async delPattern(pattern: string): Promise<void> {
    l1Store.delPattern(pattern);
    try {
      const keys = await redisClient.keys(pattern);
      if (keys && keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (err) {
      console.warn(`Cache delPattern error for "${pattern}":`, (err as Error).message);
    }
  }

  /**
   * Complete blog cache invalidation helper
   * Call whenever blogs are created, updated, deleted, or reacted to
   */
  static async invalidateBlogCaches(slug?: string, blogId?: string): Promise<void> {
    try {
      // Invalidate all cached blog query listings
      await this.delPattern('blogs:list:*');
      await this.delPattern('blogs:featured:*');

      if (slug) {
        await this.del(`blog:slug:${slug}`);
      }
      if (blogId) {
        await this.del(`blog:id:${blogId}`);
      }
      // Invalidate category breakdown and admin dashboard analytics
      await this.del('blogs:categories:summary');
      await this.del('admin:analytics:overview');
    } catch (err) {
      console.warn('Error during blog cache invalidation:', (err as Error).message);
    }
  }

  /**
   * Invalidate admin analytics dashboard cache
   */
  static async invalidateAdminAnalytics(): Promise<void> {
    await this.del('admin:analytics:overview');
  }

  /**
   * Invalidate specific user profile and authenticated session cache
   */
  static async invalidateUserProfile(userId: string): Promise<void> {
    await Promise.all([
      this.del(`user:profile:${userId}`),
      this.del(`user:session:${userId}`),
    ]);
  }

  /**
   * Invalidate authenticated session cache for a user (e.g., when banned, role changed, or password reset)
   */
  static async invalidateUserSession(userId: string): Promise<void> {
    await this.del(`user:session:${userId}`);
  }

  /**
   * Invalidate admin badges and pending counter caches
   */
  static async invalidateAdminBadges(): Promise<void> {
    await Promise.all([
      this.del('admin:badge:contributors'),
      this.del('admin:badge:inquiries'),
      this.del('admin:stats:waitlist'),
      this.del('admin:analytics:overview'),
    ]);
  }

  /**
   * Invalidate waitlist statistics and specific user status cache
   */
  static async invalidateWaitlist(userId?: string): Promise<void> {
    const promises = [this.del('admin:stats:waitlist')];
    if (userId) {
      promises.push(this.del(`waitlist:status:${userId}`));
    }
    await Promise.all(promises);
  }

  /**
   * Invalidate practice sheet cache
   */
  static async invalidatePracticeCaches(sheetType?: string): Promise<void> {
    try {
      if (sheetType) {
        await this.del(`practice:sheet:${sheetType}`);
      } else {
        await this.delPattern('practice:sheet:*');
      }
      await this.del('practice:leaderboard');
      await this.delPattern('practice:admin:*');
    } catch (err) {
      console.warn('Error during practice cache invalidation:', (err as Error).message);
    }
  }
}
