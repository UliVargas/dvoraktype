import { describe, expect, it } from "vitest";
import {
  SESSION_COOKIE,
  ensureRequestSessionId,
  ensureSessionId,
  getSessionId,
  isValidSessionId,
  sessionCookieOptions,
} from "./session";

// Minimal stand-in for Qwik City's Cookie API
function fakeCookie(initial?: string) {
  const store = new Map<string, string>();
  if (initial !== undefined) store.set(SESSION_COOKIE, initial);
  const sets: { name: string; value: string; options: unknown }[] = [];
  return {
    sets,
    get: (name: string) =>
      store.has(name) ? { value: store.get(name)! } : null,
    set: (name: string, value: string, options: unknown) => {
      store.set(name, value);
      sets.push({ name, value, options });
    },
  };
}

const validId = "3f0b8f6e-1c2d-4e5f-9a8b-7c6d5e4f3a2b";

describe("isValidSessionId", () => {
  it("accepts UUIDs produced by crypto.randomUUID", () => {
    expect(isValidSessionId(crypto.randomUUID())).toBe(true);
    expect(isValidSessionId(validId)).toBe(true);
  });

  it.each([
    ["empty", ""],
    ["arbitrary text", "admin"],
    ["oversized", "a".repeat(10_000)],
    ["UUID with extra suffix", `${validId}x`],
    ["SQL-looking", "' OR 1=1 --"],
  ])("rejects %s", (_label, value) => {
    expect(isValidSessionId(value)).toBe(false);
  });
});

describe("sessionCookieOptions", () => {
  it("is httpOnly, lax, site-wide and long-lived", () => {
    expect(sessionCookieOptions(false)).toEqual({
      path: "/",
      maxAge: [365, "days"],
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
  });

  it("is secure in production", () => {
    expect(sessionCookieOptions(true).secure).toBe(true);
  });
});

describe("getSessionId", () => {
  it("returns a valid cookie value", () => {
    expect(getSessionId(fakeCookie(validId))).toBe(validId);
  });

  it("ignores missing or malformed values", () => {
    expect(getSessionId(fakeCookie())).toBeUndefined();
    expect(getSessionId(fakeCookie("not-a-uuid"))).toBeUndefined();
  });
});

describe("ensureSessionId", () => {
  it("keeps a valid session and re-sets it with hardened flags", () => {
    const cookie = fakeCookie(validId);
    expect(ensureSessionId(cookie, true)).toBe(validId);
    expect(cookie.sets).toEqual([
      { name: SESSION_COOKIE, value: validId, options: sessionCookieOptions(true) },
    ]);
  });

  it("issues a new session when the cookie is missing", () => {
    const cookie = fakeCookie();
    const id = ensureSessionId(cookie, false);
    expect(isValidSessionId(id)).toBe(true);
    expect(cookie.sets[0]).toMatchObject({ name: SESSION_COOKIE, value: id });
  });

  it("replaces a malformed session instead of trusting it", () => {
    const cookie = fakeCookie("not-a-uuid");
    const id = ensureSessionId(cookie, false);
    expect(id).not.toBe("not-a-uuid");
    expect(isValidSessionId(id)).toBe(true);
  });
});

describe("ensureRequestSessionId", () => {
  it("issues a single session per request even when several loaders ask for one", () => {
    // Layout and page loaders run in parallel on a first visit without a cookie
    const cookie = fakeCookie();
    const event = { cookie, sharedMap: new Map<string, unknown>() };
    const fromLayout = ensureRequestSessionId(event);
    const fromPage = ensureRequestSessionId(event);
    expect(fromPage).toBe(fromLayout);
    expect(cookie.sets).toHaveLength(1);
  });

  it("keeps an existing valid session", () => {
    const event = { cookie: fakeCookie(validId), sharedMap: new Map<string, unknown>() };
    expect(ensureRequestSessionId(event)).toBe(validId);
  });
});
