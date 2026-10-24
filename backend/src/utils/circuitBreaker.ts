export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions<T = any> {
  failureThreshold?: number; // Consecutive failures before tripping OPEN
  resetTimeoutMs?: number;   // Time to stay OPEN before testing HALF_OPEN
  name?: string;             // Identification name for observability logs
  fallback?: (err: Error) => Promise<T> | T; // Default fallback on open circuit or failure
}

/**
 * Production Circuit Breaker Pattern
 * Prevents cascading latency failures when external third-party services (SMTP, Cloudinary, APIs)
 * degrade or experience partial outages.
 */
export class CircuitBreaker<TFallback = any> {
  private state: CircuitState = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly defaultFallback?: (err: Error) => Promise<TFallback> | TFallback;
  public readonly name: string;

  constructor(options: CircuitBreakerOptions<TFallback> = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeoutMs = options.resetTimeoutMs || 30000; // 30 seconds
    this.name = options.name || 'DefaultCircuitBreaker';
    this.defaultFallback = options.fallback;
  }

  public getState(): CircuitState {
    // Check if recovery window has passed and transition from OPEN to HALF_OPEN
    if (this.state === 'OPEN' && Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
      this.state = 'HALF_OPEN';
      console.log(`🔌 [CircuitBreaker:${this.name}] Transitioning from OPEN to HALF_OPEN (probing recovery).`);
    }
    return this.state;
  }

  public async execute<T = TFallback>(
    fn: () => Promise<T>,
    fallback?: (err: Error) => Promise<T> | T
  ): Promise<T> {
    const currentState = this.getState();
    const activeFallback = (fallback || this.defaultFallback) as ((err: Error) => Promise<T> | T) | undefined;

    if (currentState === 'OPEN') {
      const tripError = new Error(`Circuit for [${this.name}] is OPEN. Fast-failing external dependency.`);
      console.warn(`⚡ [CircuitBreaker:${this.name}] Fast-fail triggered. Bypassing external call.`);
      if (activeFallback) {
        return activeFallback(tripError);
      }
      throw tripError;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      if (activeFallback) {
        return activeFallback(error as Error);
      }
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      console.log(`✅ [CircuitBreaker:${this.name}] Recovery probe succeeded. Restoring state to CLOSED.`);
    }
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(err: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    console.warn(
      `⚠️ [CircuitBreaker:${this.name}] Failure detected (${this.failureCount}/${this.failureThreshold}): ${err.message}`
    );

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.error(
        `🚨 [CircuitBreaker:${this.name}] Failure threshold reached. Circuit tripped to OPEN for ${this.resetTimeoutMs / 1000}s.`
      );
    }
  }
}

// Pre-configured singleton circuit breakers for external third-party services
export const smtpCircuitBreaker = new CircuitBreaker({
  name: 'GoogleSMTP',
  failureThreshold: 3,
  resetTimeoutMs: 30000,
});

export const cloudinaryCircuitBreaker = new CircuitBreaker({
  name: 'CloudinaryAPI',
  failureThreshold: 3,
  resetTimeoutMs: 30000,
});
