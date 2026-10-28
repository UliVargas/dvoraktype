# Session and Abuse Hardening

Objective: make the anonymous session cookie safe, and protect public endpoints from abuse and malformed input.
Branch: `fix/session-hardening` · Delivery: ask-on-risk · Test runner: Vitest

## Specs

- **S1**: One helper owns the `sessionId` cookie. It sets `httpOnly`, `secure` (in production) and `sameSite: "lax"`, and rejects values that are not UUIDs. Evidence: the cookie is set in 3 places without these flags (`src/routes/layout.tsx:26`, `src/routes/index.tsx:15`, `src/routes/sugerencias/index.tsx:14`), and `progress.service.ts:16-20` inserts any value as `users.id`.
- **S2**: The `/sugerencias` form limits message length (`.max(2000)`), includes a honeypot field, and is rate limited per IP and session. Evidence: `sugerencias/index.tsx:33-36` only has `min(10)`.
- **S3**: `/api/layout` returns 400 for malformed JSON instead of 500. Evidence: `src/routes/api/layout/index.ts:11` calls `request.json()` unguarded.
- **S4**: The origin check works behind Railway's proxy. Enable `getOrigin` with `x-forwarded-proto` and `x-forwarded-host` (`src/entry.express.tsx:38-45`), or set `ORIGIN` per environment instead of hardcoding it in the Dockerfile.
- **S5**: `compose.yml` binds Postgres to `127.0.0.1:5432:5432`, not to all interfaces.

## Tasks

- [x] T1 (S1) `9cf36ad`: add the cookie helper and replace the 3 call sites. Route: inline. Risk: item 2 (security), so it needs an independent verifier.
- [x] T2 (S2) `9cf36ad`: add zod max, the honeypot and rate limiting (for example `express-rate-limit` on POST in `entry.express.tsx`). Route: inline.
- [x] T3 (S3, S4) `9cf36ad`: guard the JSON parsing and configure the origin. Route: inline.
- [x] T4 (S5) `9cf36ad`: change the compose port binding. Route: inline.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir [...]"
- **L2** (2026-10-28): observed, and identical before and after the dependency update: a form POST from a foreign `Origin` gets 403 (the Qwik CSRF check works), but a JSON POST to `/api/layout` from a foreign `Origin` gets 200. Qwik only checks form content types, and browsers need a CORS preflight to send cross-site JSON. Under S3, also reject requests whose `Content-Type` is not `application/json`, and check `Origin` explicitly.
- **L3** (2026-10-28, user): "sigue con el #3"
- **L4** (2026-10-28): decisions.
  - Railway does not publish a client-IP trust contract. Staff say the edge overwrites `X-Forwarded-For`, `X-Forwarded-Host` and `X-Forwarded-Proto`, while `X-Real-IP` has been buggy. So `clientIp` takes the first `X-Forwarded-For` entry (best effort), and the feedback limit is keyed by both IP and session.
  - The rate limiter is in memory (single instance, resets on restart) and adds no new dependency.
  - The honeypot silently returns success so bots get no signal.
  - `/api/layout` now requires `application/json`. This also closes the foreign-origin JSON POST from L2, since browsers need a preflight for it.
  - `ORIGIN` is no longer hardcoded in the Dockerfile. It is derived from the forwarded headers unless set, which is documented in the README.
- **L5** (2026-10-28): evidence.
  - RED: the new modules did not exist. GREEN: 69/69 tests with `TEST_DATABASE_URL`; tsc, eslint and build are clean.
  - End to end on the built server without `ORIGIN`:
    - the cookie is `HttpOnly; SameSite=Lax; Secure`;
    - `sessionId=admin` is replaced and stores no row;
    - `/api/layout`: malformed and `text/plain` bodies return 400, a valid one returns 200;
    - sugerencias: same origin returns 200 and a foreign one 403;
    - the honeypot returns 200 and stores no row, and 2001 characters return 400;
    - the 6th submission returns 429; a new session from the same IP returns 429, and from a new IP returns 200.
  - Risk: item 2. An independent verifier was launched.
- **L6** (2026-10-28): native review (lens: reliability, user consent `granted`, lineage `review-4cc0ebd1c2ab009f`): approved and acknowledged. R3-layout-content-type-caller was refuted, because `src/routes/layout.tsx:45` already sends `Content-Type: application/json`.
- **L7** (2026-10-28): independent verifier verdict: PASS for S1–S5 with no blockers. Old flagless cookies are upgraded and keep their data. A browser cannot set `X-Forwarded-Host` cross-site without a preflight, so CSRF is not weakened.
- **L8** (2026-10-28, user): "corrige lo del rate limit y haz merge". Added `takeAll` and `release`: both keys are checked together and consumed only when both are under the limit, and the attempt is refunded when the save fails.
  - RED: 2 new tests failed. GREEN: 71/71; tsc, eslint and build are clean.
  - End to end: an exhausted session gets 429 from a new IP, and that IP then still gets its full 5 submissions before a 429.
- **L9** (2026-10-28): follow-ups, none worse than baseline.
  - The limit relies on Railway overwriting `X-Forwarded-For`. Requests without a cookie always get a fresh session, so only the IP key limits bots. Consider the right-most entry or a configurable number of trusted hops.
  - The `Secure` cookie means a production build served over plain http (a LAN IP, or Safari on localhost) loses its session.
  - The first visit creates 2 user rows because the parallel loaders each mint an id (pre-existing).
  - A password manager could autofill the honeypot.
  - The feedback action has no integration test.
- **L10** (2026-10-28): native review of the merged #3 including the rate limit fix (lens: reliability, user consent `granted`, lineage `review-dfa5db319282e9af`): approved and acknowledged. New informational findings:
  - R3-release-window-rollover: `release` can refund an attempt into a newer window after the old one expired, slightly over-granting quota.
  - R3-origin-derivation-host-fallback: a proxy that omits the `X-Forwarded-*` headers would make forms return 403. Mitigation: set `ORIGIN`.
  Already listed in L9: XFF spoofing, Secure cookie over plain http, and the untested action wiring.
