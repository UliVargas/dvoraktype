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
    /**
     * Records an attempt for every key, or for none of them when any key is
     * over its limit, so one exhausted key never burns another key's quota.
     */
    takeAll(keys: readonly string[]): boolean {
      const time = now();
      prune(time);
      if (keys.some((key) => (windows.get(key)?.count ?? 0) >= limit)) {
        return false;
      }
      for (const key of keys) {
        const w = windows.get(key);
        if (w) w.count++;
        else windows.set(key, { start: time, count: 1 });
      }
      return true;
    },
    /** Gives back attempts that were recorded but did not complete. */
    release(keys: readonly string[]) {
      for (const key of keys) {
        const w = windows.get(key);
        if (w && w.count > 0) w.count--;
      }
    },
    size: () => windows.size,
  };
}

// Feedback form: at most 5 messages per hour per client IP and per session
export const FEEDBACK_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };
export const feedbackLimiter = createRateLimiter(FEEDBACK_LIMIT);
