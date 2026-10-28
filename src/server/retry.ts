// ===================================================================
// Retrying database work at startup.
// Only connection-level failures are retried: a database that is still
// booting or briefly unreachable. Anything else (bad SQL, wrong password,
// a failing migration) fails immediately.
// ===================================================================

const TRANSIENT_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ECONNRESET",
  "CONNECT_TIMEOUT", // postgres-js connect timeout
  "57P03", // cannot_connect_now: the server is starting up
]);

export function isTransientDbError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && TRANSIENT_CODES.has(code);
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
