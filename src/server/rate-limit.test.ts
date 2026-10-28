import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

function clock(start = 0) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe("createRateLimiter", () => {
  it("allows up to the limit per key within the window", () => {
    const c = clock();
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000, now: c.now });

    expect([1, 2, 3].map(() => limiter.take("a"))).toEqual([true, true, true]);
    expect(limiter.take("a")).toBe(false);
  });

  it("tracks keys independently", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: clock().now });
    expect(limiter.take("a")).toBe(true);
    expect(limiter.take("b")).toBe(true);
    expect(limiter.take("a")).toBe(false);
  });

  it("allows again once the window has passed", () => {
    const c = clock();
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: c.now });
    expect(limiter.take("a")).toBe(true);
    c.advance(999);
    expect(limiter.take("a")).toBe(false);
    c.advance(1);
    expect(limiter.take("a")).toBe(true);
  });

  it("does not consume quota on denied attempts", () => {
    const c = clock();
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: c.now });
    limiter.take("a");
    for (let i = 0; i < 10; i++) limiter.take("a");
    c.advance(1000);
    expect(limiter.take("a")).toBe(true);
  });

  it("forgets expired keys so memory stays bounded", () => {
    const c = clock();
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: c.now });
    for (let i = 0; i < 100; i++) limiter.take(`k${i}`);
    c.advance(1000);
    limiter.take("fresh");
    expect(limiter.size()).toBe(1);
  });
});
