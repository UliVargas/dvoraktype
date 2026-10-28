import type { CookieOptions } from "@builder.io/qwik-city";

// ===================================================================
// Anonymous session cookie.
// The session id is the only credential a visitor has, so it is
// httpOnly, never sent cross-site on POSTs, and must be a UUID we
// issued: anything else is discarded instead of stored as a user id.
// ===================================================================

export const SESSION_COOKIE = "sessionId";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The subset of Qwik City's Cookie API this module needs
interface CookieJar {
  get(name: string): { value: string } | null;
  set(name: string, value: string, options?: CookieOptions): void;
}

export function isValidSessionId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function sessionCookieOptions(isProduction: boolean): CookieOptions {
  return {
    path: "/",
    maxAge: [365, "days"],
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
  };
}

/** The current session id, or undefined when missing or malformed. */
export function getSessionId(cookie: CookieJar): string | undefined {
  const value = cookie.get(SESSION_COOKIE)?.value;
  return value && isValidSessionId(value) ? value : undefined;
}

/**
 * Returns the session id, issuing a new one when needed. The cookie is
 * always re-set so sessions created before the flags existed get them too.
 */
export function ensureSessionId(
  cookie: CookieJar,
  isProduction = process.env.NODE_ENV === "production",
): string {
  const sessionId = getSessionId(cookie) ?? crypto.randomUUID();
  cookie.set(SESSION_COOKIE, sessionId, sessionCookieOptions(isProduction));
  return sessionId;
}

const REQUEST_SESSION_KEY = "sessionId";

/**
 * Like ensureSessionId, but once per request: on a first visit the layout and
 * page loaders run in parallel, and each would otherwise mint its own id and
 * create a user row for it. The first caller stores the id in the request's
 * sharedMap; the others reuse it.
 */
export function ensureRequestSessionId(event: {
  cookie: CookieJar;
  sharedMap: Map<string, unknown>;
}): string {
  const existing = event.sharedMap.get(REQUEST_SESSION_KEY);
  if (typeof existing === "string") return existing;
  const sessionId = ensureSessionId(event.cookie);
  event.sharedMap.set(REQUEST_SESSION_KEY, sessionId);
  return sessionId;
}
