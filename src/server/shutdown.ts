interface ShutdownDeps {
  server: { close: (callback: () => void) => void };
  closeDb: () => Promise<unknown>;
  timeoutMs: number;
  exit: (code: number) => void;
  log: (message: string) => void;
}

/**
 * Graceful shutdown for SIGTERM/SIGINT: stop accepting connections, let
 * in-flight requests finish, close the database pool, then exit. If that
 * takes longer than `timeoutMs`, exit with an error instead of hanging.
 */
export function createShutdown({ server, closeDb, timeoutMs, exit, log }: ShutdownDeps) {
  let running: Promise<void> | undefined;

  return (signal: string) => {
    running ??= (async () => {
      log(`${signal} received, shutting down`);
      const timer = setTimeout(() => {
        log(`Shutdown took longer than ${timeoutMs} ms, forcing exit`);
        exit(1);
      }, timeoutMs);
      timer.unref?.();

      await new Promise<void>((resolve) => server.close(() => resolve()));
      await closeDb();
      clearTimeout(timer);
      exit(0);
    })();
    return running;
  };
}
