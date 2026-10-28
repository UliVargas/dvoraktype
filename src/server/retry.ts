// ===================================================================
// Retrying database work at startup.
// Only transient failures are retried: a database that is still booting or
// briefly unreachable, or a migration that timed out waiting for a table
// lock held by live traffic. Anything else (bad SQL, wrong password, a
// failing migration) fails immediately.
// ===================================================================

const TRANSIENT_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ECONNRESET",
  "CONNECT_TIMEOUT", // postgres-js connect timeout
  "57P03", // cannot_connect_now: the server is starting up
  "55P03", // lock_not_available: a migration timed out waiting for a table lock
]);

/** Checks the error and its `cause` chain (drizzle wraps driver errors). */
export function isTransientDbError(error: unknown): boolean {
  for (let e = error, depth = 0; e && depth < 5; depth++) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === "string" && TRANSIENT_CODES.has(code)) return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

interface RetryOptions {
  attempts: number;
  baseMs: number;
  maxMs: number;
  sleep?: (ms: number) => Promise<void>;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Runs `fn`, retrying transient database errors with exponential backoff. */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  { attempts, baseMs, maxMs, sleep = defaultSleep, onRetry }: RetryOptions,
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= attempts || !isTransientDbError(error)) throw error;
      const delayMs = Math.min(baseMs * 2 ** (attempt - 1), maxMs);
      onRetry?.(error, attempt, delayMs);
      await sleep(delayMs);
    }
  }
}
