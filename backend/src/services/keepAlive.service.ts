import { prisma } from '../config/database.js';
import { config } from '../config/env.js';

let dbHeartbeatTimer: NodeJS.Timeout | null = null;
let selfPingTimer: NodeJS.Timeout | null = null;

/**
 * KeepAliveService
 * -----------------------------------------------------------
 * Eliminates cold-starts across both infrastructure tiers:
 * 1. Neon Serverless PostgreSQL: Pings DB every 4 min (240s) so compute
 *    never auto-suspends after 5 min of inactivity.
 * 2. Web Container (Render / Railway / Cloud Service): Pings external
 *    URL every 12 min so free-tier containers never sleep after 15 min.
 */
export class KeepAliveService {
  private static isDbPinging = false;
  private static isSelfPinging = false;

  /**
   * Ping Neon PostgreSQL to keep serverless compute warm
   */
  static async pingDatabase(): Promise<boolean> {
    if (this.isDbPinging) return false;
    this.isDbPinging = true;

    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const elapsed = Date.now() - start;
      if (config.nodeEnv === 'development') {
        console.log(`💓 [KeepAlive] Neon DB heartbeat OK (${elapsed}ms)`);
      }
      return true;
    } catch (err) {
      console.warn('⚠️ [KeepAlive] Neon DB heartbeat notice:', (err as Error).message);
      return false;
    } finally {
      this.isDbPinging = false;
    }
  }

  /**
   * Self-ping public endpoint through external reverse proxy
   * to reset cloud host idle timers (e.g., Render 15-minute shutdown)
   */
  static async pingSelf(): Promise<boolean> {
    if (this.isSelfPinging) return false;
    this.isSelfPinging = true;

    const targetUrl = `${config.apiBaseUrl}/api/v1/health`;

    try {
      // Avoid self-pinging localhost in development unless explicitly specified
      if (config.nodeEnv === 'development' && targetUrl.includes('localhost')) {
        return false;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'user-agent': 'CodeAndCoffee-KeepAlive-Daemon/1.0',
          'x-keepalive-ping': 'true',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        console.log(`🌐 [KeepAlive] Host self-ping OK: ${targetUrl} (Status ${response.status})`);
        return true;
      } else {
        console.warn(`⚠️ [KeepAlive] Host self-ping received status ${response.status} from ${targetUrl}`);
        return false;
      }
    } catch (err) {
      console.warn(`⚠️ [KeepAlive] Host self-ping notice for ${targetUrl}:`, (err as Error).message);
      return false;
    } finally {
      this.isSelfPinging = false;
    }
  }

  /**
   * Start recurring background keep-alive intervals
   */
  static start(options: { dbIntervalMs?: number; selfPingIntervalMs?: number } = {}) {
    if (!config.enableKeepAlive) {
      console.log('ℹ️ [KeepAlive] Service disabled via ENABLE_KEEP_ALIVE=false.');
      return;
    }

    const dbIntervalMs = options.dbIntervalMs || 4 * 60 * 1000; // 4 minutes (Neon threshold is 5 min)
    const selfPingIntervalMs = options.selfPingIntervalMs || 12 * 60 * 1000; // 12 minutes (Render threshold is 15 min)

    // Clear any existing timers
    this.stop();

    // 1. Neon DB Keep-Alive Heartbeat
    dbHeartbeatTimer = setInterval(() => {
      this.pingDatabase().catch((err) => {
        console.warn('⚠️ [KeepAlive] Unhandled error during DB ping:', err);
      });
    }, dbIntervalMs);

    // Initial warm-up ping after 15 seconds
    setTimeout(() => {
      this.pingDatabase().catch(() => {});
    }, 15000);

    // 2. Cloud Web Host Self-Ping (Only for production or non-localhost)
    if (config.apiBaseUrl && !config.apiBaseUrl.includes('localhost:5000')) {
      selfPingTimer = setInterval(() => {
        this.pingSelf().catch((err) => {
          console.warn('⚠️ [KeepAlive] Unhandled error during self-ping:', err);
        });
      }, selfPingIntervalMs);

      // Initial self-ping after 30 seconds to confirm public connectivity
      setTimeout(() => {
        this.pingSelf().catch(() => {});
      }, 30000);

      console.log(
        `⚡ [KeepAlive] Active: DB heartbeat (${dbIntervalMs / 60000}m) & Host ping (${selfPingIntervalMs / 60000}m) -> ${config.apiBaseUrl}`
      );
    } else {
      console.log(`⚡ [KeepAlive] Active: DB heartbeat (${dbIntervalMs / 60000}m). Host ping skipped in local dev.`);
    }

    // Clean shutdown listeners
    const onExit = () => this.stop();
    process.once('SIGTERM', onExit);
    process.once('SIGINT', onExit);
  }

  /**
   * Stop all timers cleanly
   */
  static stop() {
    if (dbHeartbeatTimer) {
      clearInterval(dbHeartbeatTimer);
      dbHeartbeatTimer = null;
    }
    if (selfPingTimer) {
      clearInterval(selfPingTimer);
      selfPingTimer = null;
    }
  }
}
