import { redisClient } from '../config/redis.js';

export class CacheService {
  /**
   * Retrieve cached item and parse JSON
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      if (typeof data === 'object') {
        return data as T;
      }
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch (err) {
      console.warn(`Cache get error for key "${key}":`, (err as Error).message);
      return null;
    }
  }

  /**
   * Cache item with TTL in seconds
   */
  static async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
    try {
      const stringified = JSON.stringify(value);
      await redisClient.set(key, stringified, 'EX', ttlSeconds);
    } catch (err) {
      console.warn(`Cache set error for key "${key}":`, (err as Error).message);
    }
  }

  /**
   * Delete a single key
   */
  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.warn(`Cache del error for key "${key}":`, (err as Error).message);
    }
  }

  /**
   * Invalidate multiple keys matching a pattern (e.g., 'blogs:list:*')
   */
  static async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys && keys.length > 0) {
        await Promise.all(keys.map((k) => redisClient.del(k)));
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
      await this.delPattern('practice:admin:*');
    } catch (err) {
      console.warn('Error during practice cache invalidation:', (err as Error).message);
    }
  }
}

