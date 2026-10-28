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

- [ ] T1 (S1): add the cookie helper and replace the 3 call sites. Route: inline. Risk: item 2 (security), so it needs an independent verifier.
- [ ] T2 (S2): add zod max, the honeypot and rate limiting (for example `express-rate-limit` on POST in `entry.express.tsx`). Route: inline.
- [ ] T3 (S3, S4): guard the JSON parsing and configure the origin. Route: inline.
- [ ] T4 (S5): change the compose port binding. Route: inline.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir [...]"
