import { describe, expect, it, vi } from "vitest";
import { createHealthHandler } from "./health";
import { isTransientDbError, retryWithBackoff } from "./retry";
import { createShutdown } from "./shutdown";

describe("retryWithBackoff", () => {
  const noSleep = vi.fn(async () => {});

  it("returns the first successful result", async () => {
    const fn = vi.fn().mockRejectedValueOnce(Object.assign(new Error("down"), { code: "ECONNREFUSED" })).mockResolvedValue("ok");
    await expect(retryWithBackoff(fn, { attempts: 3, baseMs: 100, maxMs: 1000, sleep: noSleep })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("waits with exponential backoff capped at maxMs", async () => {
    const sleep = vi.fn(async (_ms: number) => {});
    const err = Object.assign(new Error("down"), { code: "ECONNREFUSED" });
    await expect(
      retryWithBackoff(() => Promise.reject(err), { attempts: 5, baseMs: 100, maxMs: 500, sleep }),
    ).rejects.toBe(err);
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([100, 200, 400, 500]);
  });

  it("does not retry errors that aren't transient", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("syntax error at or near"));
    await expect(retryWithBackoff(fn, { attempts: 5, baseMs: 1, maxMs: 1, sleep: noSleep })).rejects.toThrow("syntax");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("isTransientDbError", () => {
  it.each(["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "EAI_AGAIN", "ECONNRESET", "CONNECT_TIMEOUT", "57P03"])(
    "treats %s as transient",
    (code) => expect(isTransientDbError(Object.assign(new Error("x"), { code }))).toBe(true),
  );

  it.each([["42601"], ["28P01"], [undefined]])("treats %s as permanent", (code) => {
    expect(isTransientDbError(Object.assign(new Error("x"), { code }))).toBe(false);
  });
});

describe("createHealthHandler", () => {
  function fakeRes() {
    const res = { statusCode: 200, body: undefined as unknown, status(c: number) { res.statusCode = c; return res; }, json(b: unknown) { res.body = b; return res; } };
    return res;
  }

  it("responds 200 when the database answers", async () => {
    const res = fakeRes();
    await createHealthHandler(async () => {})({} as never, res as never);
    expect([res.statusCode, res.body]).toEqual([200, { status: "ok" }]);
  });

  it("responds 503 when the database doesn't answer in time", async () => {
    vi.useFakeTimers();
    const res = fakeRes();
    const pending = createHealthHandler(() => new Promise(() => {}), { timeoutMs: 2000 })({} as never, res as never);
    await vi.advanceTimersByTimeAsync(2000);
    await pending;
    expect([res.statusCode, res.body]).toEqual([503, { status: "unavailable" }]);
    vi.useRealTimers();
  });

  it("responds 503 when the database doesn't", async () => {
    const res = fakeRes();
    await createHealthHandler(async () => { throw new Error("down"); })({} as never, res as never);
    expect([res.statusCode, res.body]).toEqual([503, { status: "unavailable" }]);
  });
});

describe("createShutdown", () => {
  it("stops accepting connections, closes the pool, then exits 0", async () => {
    const order: string[] = [];
    const exit = vi.fn((code: number) => order.push(`exit:${code}`));
    const shutdown = createShutdown({
      server: { close: (cb: () => void) => { order.push("server"); cb(); } },
      closeDb: async () => { order.push("db"); },
      timeoutMs: 1000,
      exit,
      log: () => {},
    });
    await shutdown("SIGTERM");
    expect(order).toEqual(["server", "db", "exit:0"]);
  });

  it("forces exit 1 when closing hangs past the timeout", async () => {
    vi.useFakeTimers();
    const exit = vi.fn();
    const shutdown = createShutdown({
      server: { close: () => {} },
      closeDb: async () => {},
      timeoutMs: 1000,
      exit,
      log: () => {},
    });
    void shutdown("SIGTERM");
    await vi.advanceTimersByTimeAsync(1000);
    expect(exit).toHaveBeenCalledWith(1);
    vi.useRealTimers();
  });

  it("only runs once when the signal repeats", async () => {
    let closes = 0;
    const shutdown = createShutdown({
      server: { close: (cb: () => void) => { closes++; cb(); } },
      closeDb: async () => {},
      timeoutMs: 1000,
      exit: () => {},
      log: () => {},
    });
    await Promise.all([shutdown("SIGTERM"), shutdown("SIGINT")]);
    expect(closes).toBe(1);
  });
});
