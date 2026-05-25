interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowTime: number,
  ) {}

  check(key: string): RateLimitResult {
    const now = Date.now();
    const existingBucket = this.buckets.get(key);

    if (!existingBucket || existingBucket.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + this.windowTime,
      });

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
      };
    }

    if (existingBucket.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil((existingBucket.resetAt - now) / 1000),
      };
    }

    existingBucket.count += 1;

    return {
      allowed: true,
      remaining: this.maxRequests - existingBucket.count,
    };
  }
}
