import { describe, expect, it } from "vitest";
import {
  clientIp,
  feedbackSchema,
  isHoneypotFilled,
  parseLayoutRequest,
  resolveOrigin,
} from "./request-rules";

describe("feedbackSchema", () => {
  const valid = { type: "bug", message: "Algo no funciona bien aquí." };

  it("accepts a normal submission, with or without an empty honeypot", () => {
    expect(feedbackSchema.safeParse(valid).success).toBe(true);
    expect(feedbackSchema.safeParse({ ...valid, website: "" }).success).toBe(true);
  });

  it("keeps the existing minimum length and type rules", () => {
    expect(feedbackSchema.safeParse({ ...valid, message: "corto" }).success).toBe(false);
    expect(feedbackSchema.safeParse({ ...valid, type: "spam" }).success).toBe(false);
  });

  it("rejects messages longer than 2000 characters", () => {
    expect(feedbackSchema.safeParse({ ...valid, message: "a".repeat(2000) }).success).toBe(true);
    expect(feedbackSchema.safeParse({ ...valid, message: "a".repeat(2001) }).success).toBe(false);
  });
});

describe("isHoneypotFilled", () => {
  it("flags submissions where the hidden field was filled", () => {
    expect(isHoneypotFilled({ website: "http://spam.example" })).toBe(true);
    expect(isHoneypotFilled({ website: "" })).toBe(false);
    expect(isHoneypotFilled({})).toBe(false);
  });
});

describe("parseLayoutRequest", () => {
  it("accepts a known variant sent as JSON", () => {
    expect(parseLayoutRequest("application/json", '{"variant":"us-dvorak-intl"}')).toEqual({
      ok: true,
      variant: "us-dvorak-intl",
    });
    expect(
      parseLayoutRequest("application/json; charset=utf-8", '{"variant":"es-dvorak-xkb"}'),
    ).toEqual({ ok: true, variant: "es-dvorak-xkb" });
  });

  it.each([
    ["malformed JSON", "application/json", "{not json"],
    ["unknown variant", "application/json", '{"variant":"qwerty"}'],
    ["missing variant", "application/json", "{}"],
    ["non-object JSON", "application/json", "null"],
    ["form content type", "application/x-www-form-urlencoded", '{"variant":"es-dvorak-xkb"}'],
    ["text/plain content type", "text/plain", '{"variant":"es-dvorak-xkb"}'],
    ["missing content type", null, '{"variant":"es-dvorak-xkb"}'],
  ])("rejects %s", (_label, contentType, body) => {
    expect(parseLayoutRequest(contentType, body).ok).toBe(false);
  });
});

describe("resolveOrigin", () => {
  const headers = (h: Record<string, string>) => (name: string) => h[name];

  it("prefers an explicit ORIGIN", () => {
    expect(
      resolveOrigin(headers({ "x-forwarded-host": "evil.example" }), "https://dvoraktype.com"),
    ).toBe("https://dvoraktype.com");
  });

  it("derives the public origin from the proxy headers", () => {
    expect(
      resolveOrigin(
        headers({ "x-forwarded-proto": "https", "x-forwarded-host": "app.up.railway.app", host: "10.0.0.5:3000" }),
        undefined,
      ),
    ).toBe("https://app.up.railway.app");
  });

  it("falls back to the Host header over http without a proxy", () => {
    expect(resolveOrigin(headers({ host: "localhost:3000" }), undefined)).toBe(
      "http://localhost:3000",
    );
  });

  it("uses the first value of comma-separated proxy headers", () => {
    expect(
      resolveOrigin(
        headers({ "x-forwarded-proto": "https, http", "x-forwarded-host": "a.example, b.example" }),
        undefined,
      ),
    ).toBe("https://a.example");
  });
});

describe("clientIp", () => {
  it("uses the first X-Forwarded-For entry", () => {
    expect(clientIp("203.0.113.7, 100.64.0.2", "100.64.0.2")).toBe("203.0.113.7");
  });

  it("falls back to the socket address", () => {
    expect(clientIp(undefined, "127.0.0.1")).toBe("127.0.0.1");
    expect(clientIp("", "127.0.0.1")).toBe("127.0.0.1");
  });
});
