import { describe, expect, it, vi } from "vitest";
import { withFallback } from "./fallback";

describe("withFallback", () => {
  it("returns the value when the work succeeds", async () => {
    const log = vi.fn();
    expect(await withFallback(() => Promise.resolve(42), 0, "x", log)).toBe(42);
    expect(log).not.toHaveBeenCalled();
  });

  it("logs the failure and returns the fallback", async () => {
    const log = vi.fn();
    const error = new Error("connection refused");
    expect(await withFallback(() => Promise.reject(error), 7, "loading settings", log)).toBe(7);
    expect(log).toHaveBeenCalledWith("loading settings failed, using a fallback", error);
  });

  it("also catches a synchronous throw", async () => {
    const log = vi.fn();
    const work = () => {
      throw new Error("sync");
    };
    expect(await withFallback(work, "fallback", "x", log)).toBe("fallback");
  });
});
