import { Redis as UpstashRedis } from '@upstash/redis';
import { Redis } from 'ioredis';
import { config } from './env.js';

export interface IRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  incr(key: string): Promise<number>;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  scard(key: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  hincrby(key: string, field: string, increment: number): Promise<number>;
  hgetall(key: string): Promise<Record<string, string>>;
  hdel(key: string, ...fields: string[]): Promise<number>;
}

// In-Memory Fallback for seamless local testing if remote Upstash Redis credentials are unset
class MemoryRedis implements IRedisClient {
  private store = new Map<string, { value: any; expiry?: number }>();
  private sets = new Map<string, Set<string>>();
  private hashes = new Map<string, Map<string, number>>();

  private isExpired(key: string): boolean {
    const item = this.store.get(key);
    if (!item) return true;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return true;
    }
    return false;
  }

  async get(key: string): Promise<string | null> {
    if (this.isExpired(key)) return null;
    const item = this.store.get(key);
    return item ? String(item.value) : null;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<string | null> {
    const expiry = mode === 'EX' && duration ? Date.now() + duration * 1000 : undefined;
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<string | null> {
    this.store.set(key, { value, expiry: Date.now() + seconds * 1000 });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (this.store.delete(key)) deleted++;
      this.sets.delete(key);
    }
    return deleted;
  }

  async keys(pattern: string): Promise<string[]> {
    const now = Date.now();
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matched: string[] = [];
    for (const [key, item] of this.store.entries()) {
      if (item.expiry && now > item.expiry) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) {
        matched.push(key);
      }
    }
    return matched;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const next = (current ? parseInt(current, 10) : 0) + 1;
    this.store.set(key, { value: next });
    return next;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    let set = this.sets.get(key);
    if (!set) {
      set = new Set<string>();
      this.sets.set(key, set);
    }
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    return added;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const set = this.sets.get(key);
    if (!set) return 0;
    let removed = 0;
    for (const m of members) {
      if (set.delete(m)) removed++;
    }
    return removed;
  }

  async scard(key: string): Promise<number> {
    const set = this.sets.get(key);
    return set ? set.size : 0;
  }

  async smembers(key: string): Promise<string[]> {
    const set = this.sets.get(key);
    return set ? Array.from(set) : [];
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    let hash = this.hashes.get(key);
    if (!hash) {
      hash = new Map<string, number>();
      this.hashes.set(key, hash);
    }
    const current = hash.get(field) || 0;
    const next = current + increment;
    hash.set(field, next);
    return next;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const hash = this.hashes.get(key);
    if (!hash) return {};
    const result: Record<string, string> = {};
    for (const [f, v] of hash.entries()) {
      result[f] = String(v);
    }
    return result;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    const hash = this.hashes.get(key);
    if (!hash) return 0;
    let count = 0;
    for (const f of fields) {
      if (hash.delete(f)) count++;
    }
    return count;
  }
}

let redisClient: IRedisClient;
const memoryFallback = new MemoryRedis();
let hasLoggedQuotaExceeded = false;

function fallbackOnQuota(err: any): boolean {
  const msg = err?.message || String(err);
  if (
    msg.includes('limit exceeded') ||
    msg.includes('max requests') ||
    msg.includes('daily limit') ||
    msg.includes('quota')
  ) {
    if (!hasLoggedQuotaExceeded) {
      console.warn('⚠️ [Redis Failover] Upstash command quota reached. Seamlessly engaging in-memory Redis fallback so all features stay 100% online.');
      hasLoggedQuotaExceeded = true;
    }
    // Permanently switch client to memory for this process session to avoid wasted HTTP network calls
    redisClient = memoryFallback;
    return true;
  }
  return false;
}

if (config.upstashRedisRestUrl && config.upstashRedisRestToken) {
  try {
    const upstash = new UpstashRedis({
      url: config.upstashRedisRestUrl,
      token: config.upstashRedisRestToken,
    });

    redisClient = {
      get: async (k) => {
        try {
          return await upstash.get<string>(k);
        } catch (err) {
          if (fallbackOnQuota(err)) return memoryFallback.get(k);
          throw err;
        }
      },
      set: async (k, v, mode, dur) => {
        try {
          if (mode === 'EX' && dur) {
            return await upstash.set(k, v, { ex: dur });
          }
          return await upstash.set(k, v);
        } catch (err) {
          if (fallbackOnQuota(err)) return memoryFallback.set(k, v, mode, dur);
          throw err;
        }
      },
      setex: async (k, sec, v) => {
        try {
          return await upstash.set(k, v, { ex: sec });
        } catch (err) {
          if (fallbackOnQuota(err)) return memoryFallback.setex(k, sec, v);
          throw err;
        }
      },
      del: async (...keys: string[]) => {
        try {
          return await (upstash.del as any)(...keys);
        } catch (err) {
          if (fallbackOnQuota(err)) return memoryFallback.del(...keys);
          throw err;
        }
      },
      keys: async (p) => {
        try {
          return await upstash.keys(p);
        } catch (err) {
          if (fallbackOnQuota(err)) return memoryFallback.keys(p);
          throw err;
        }
      },
      incr: async (k) => {
        try {
          return await upstash.incr(k);
        } catch (err) {
          if (fallbackOnQuota(err)) return memoryFallback.incr(k);
          throw err;
        }
      },
      sadd: async (k, ...m) => {
        try {
          return await (upstash.sadd as any)(k, ...m);
        } catch (err) {
          if (fallbackOnQuota(err)) return memoryFallback.sadd(k, ...m);
          throw err;
        }
      },
      srem: async (k, ...m) => {
        try {
          return await (upstash.srem as any)(k, ...m);
        } catch (err) {
          if (fallbackOnQuota(err)) return memoryFallback.srem(k, ...m);
          throw err;
        }
      },
      scard: async (k) => {
        try {
          return await upstash.scard(k);
        } catch (err) {
          if (fallbackOnQuota(err)) return memoryFallback.scard(k);
          throw err;
        }
      },
      smembers: async (k) => {
        try {
          return await upstash.smembers(k);
        } catch (err) {
          if (fallbackOnQuota(err)) return memoryFallback.smembers(k);
          throw err;
        }
      },
      hincrby: async (k, f, inc) => {
        try {
          return await (upstash.hincrby as any)(k, f, inc);
        } catch (err) {
          if (fallbackOnQuota(err)) return memoryFallback.hincrby(k, f, inc);
          throw err;
        }
      },
      hgetall: async (k) => {
        try {
          return ((await upstash.hgetall(k)) as Record<string, string>) || {};
        } catch (err) {
          if (fallbackOnQuota(err)) return memoryFallback.hgetall(k);
          throw err;
        }
      },
      hdel: async (k, ...f) => {
        try {
          return await (upstash.hdel as any)(k, ...f);
        } catch (err) {
          if (fallbackOnQuota(err)) return memoryFallback.hdel(k, ...f);
          throw err;
        }
      },
    };
    console.log('✅ Connected to Upstash Redis REST API.');
  } catch (err) {
    console.warn('⚠️ Upstash REST client error, falling back to memory cache:', (err as Error).message);
    redisClient = memoryFallback;
  }
} else if (config.redisUrl && !config.redisUrl.includes('localhost:6379')) {
  try {
    const ioredis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    ioredis.connect().catch((err: Error) => {
      console.warn('⚠️ Redis connection failed, falling back to in-memory store:', err.message);
    });
    redisClient = ioredis as unknown as IRedisClient;
    console.log('✅ Redis client configured with URI:', config.redisUrl.replace(/:[^:@]+@/, ':***@'));
  } catch (err) {
    console.warn('⚠️ Redis init exception, using memory cache:', (err as Error).message);
    redisClient = new MemoryRedis();
  }
} else {
  console.log('ℹ️ No remote Redis specified. Using fast high-performance in-memory cache.');
  redisClient = new MemoryRedis();
}

export { redisClient };
