// ===================================================================
// In-memory fixed-window rate limiter.
// Good enough for a single instance; state resets on restart and is
// not shared between replicas.
// ===================================================================

interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
}

export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: RateLimiterOptions) {
  const windows = new Map<string, { start: number; count: number }>();

  const prune = (time: number) => {
    for (const [key, w] of windows) {
      if (time - w.start >= windowMs) windows.delete(key);
    }
  };

  return {
    /** Records an attempt for `key`; false when the key is over its limit. */
    take(key: string): boolean {
      const time = now();
      prune(time);
      const w = windows.get(key);
      if (!w) {
        windows.set(key, { start: time, count: 1 });
        return true;
      }
      if (w.count >= limit) return false;
      w.count++;
      return true;
    },
    size: () => windows.size,
  };
}

// Feedback form: at most 5 messages per hour per client IP and per session
export const FEEDBACK_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };
export const feedbackLimiter = createRateLimiter(FEEDBACK_LIMIT);
