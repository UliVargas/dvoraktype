/**
 * Awaits `work`; if it fails, logs the error and returns `fallback`.
 *
 * Route loaders use it for database reads: after an action, Qwik City reruns
 * the page's loaders in the same response, and a loader that throws turns
 * that response into an HTML 500, which the client handles by navigating
 * away. Degrading lets the action's own error reach the page instead.
 */
export async function withFallback<T>(
  work: Promise<T>,
  fallback: T,
  what: string,
  log: (message: string, error: unknown) => void = console.error,
): Promise<T> {
  try {
    return await work;
  } catch (error) {
    log(`${what} failed, using a fallback`, error);
    return fallback;
  }
}
