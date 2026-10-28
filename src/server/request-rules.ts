import { z } from "zod";
import { isLayoutVariant } from "../data/layout-registry";
import type { LayoutVariant } from "../data/types";

// ===================================================================
// Validation for public endpoints and proxy-aware request helpers.
// ===================================================================

export const feedbackSchema = z.object({
  type: z.enum(["suggestion", "bug", "other"]),
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres.")
    .max(2000, "El mensaje no puede superar los 2000 caracteres."),
  // Honeypot: hidden from people, filled in by naive bots
  website: z.string().optional(),
});

export function isHoneypotFilled(data: { website?: string }): boolean {
  return !!data.website;
}

export type LayoutRequest =
  | { ok: true; variant: LayoutVariant }
  | { ok: false; error: string };

/**
 * Parses the body of POST /api/layout. Only JSON is accepted: browsers can't
 * send it cross-site without a CORS preflight, which this API never grants.
 */
export function parseLayoutRequest(
  contentType: string | null,
  body: string,
): LayoutRequest {
  if (contentType?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return { ok: false, error: "Expected application/json" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return { ok: false, error: "Malformed JSON" };
  }

  const variant = (parsed as { variant?: unknown } | null)?.variant;
  if (!isLayoutVariant(variant)) {
    return { ok: false, error: "Invalid variant" };
  }
  return { ok: true, variant };
}

const firstValue = (header: string | undefined) =>
  header?.split(",")[0].trim() || undefined;

/**
 * Public origin used by Qwik City's CSRF check. Behind Railway's proxy the
 * socket is plain http, so the origin comes from the forwarded headers unless
 * ORIGIN pins it explicitly.
 */
export function resolveOrigin(
  header: (name: string) => string | undefined,
  explicitOrigin: string | undefined,
): string {
  if (explicitOrigin) return explicitOrigin;
  const protocol = firstValue(header("x-forwarded-proto")) ?? "http";
  const host = firstValue(header("x-forwarded-host")) ?? header("host");
  return `${protocol}://${host}`;
}

/**
 * Best-effort client IP for rate limiting. Railway's edge overwrites
 * X-Forwarded-For, putting the client first; without a proxy the socket
 * address is used.
 */
export function clientIp(
  forwardedFor: string | undefined,
  socketAddress: string | undefined,
): string {
  return firstValue(forwardedFor) ?? socketAddress ?? "unknown";
}
