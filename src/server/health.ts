import type { Request, Response } from "express";

/**
 * GET /health: 200 when the database answers, 503 otherwise. A database that
 * stops responding (rather than refusing connections) would otherwise hang the
 * probe, so the ping is bounded by `timeoutMs`.
 */
export function createHealthHandler(
  ping: () => Promise<unknown>,
  { timeoutMs = 2000 }: { timeoutMs?: number } = {},
) {
  return async (_req: Request, res: Response) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("health check timed out")), timeoutMs);
    });
    try {
      await Promise.race([ping(), timeout]);
      res.status(200).json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    } finally {
      clearTimeout(timer);
    }
  };
}
