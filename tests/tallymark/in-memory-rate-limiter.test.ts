import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InMemoryRateLimiter } from "../../src/shared/rate-limit/in-memory-rate-limiter";

describe("InMemoryRateLimiter", () => {
  it("allows requests until the bucket limit is reached", () => {
    const rateLimiter = new InMemoryRateLimiter(2, 60_000);

    assert.deepEqual(rateLimiter.check("fund-1"), {
      allowed: true,
      remaining: 1,
    });
    assert.deepEqual(rateLimiter.check("fund-1"), {
      allowed: true,
      remaining: 0,
    });

    const blocked = rateLimiter.check("fund-1");

    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
    assert.equal(typeof blocked.retryAfterSeconds, "number");
  });

  it("tracks different keys independently", () => {
    const rateLimiter = new InMemoryRateLimiter(1, 60_000);

    assert.equal(rateLimiter.check("fund-1").allowed, true);
    assert.equal(rateLimiter.check("fund-2").allowed, true);
    assert.equal(rateLimiter.check("fund-1").allowed, false);
  });

  it("resets an expired bucket", () => {
    const rateLimiter = new InMemoryRateLimiter(1, 0);

    assert.deepEqual(rateLimiter.check("fund-1"), {
      allowed: true,
      remaining: 0,
    });
    assert.deepEqual(rateLimiter.check("fund-1"), {
      allowed: true,
      remaining: 0,
    });
  });
});
