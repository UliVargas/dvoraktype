# Ops and Cleanup

Objective: produce a smaller, observable production image, accurate docs and a clean schema.
Branch: `chore/ops-and-cleanup` · Delivery: ask-on-risk · Test runner: Vitest

## Specs

- **S1**: The final Docker image contains production dependencies only (`pnpm install --prod` stage). Evidence: the `deps` stage installs everything, and `final` copies it.
- **S2**: The app exposes a `/health` route that checks the DB, and handles SIGTERM by closing the HTTP server and the Postgres pool. Compression is either enabled or removed on purpose (it is commented out at `src/entry.express.tsx:72`).
- **S3**: The README matches reality: Postgres via `postgres-js` (not Turso/SQLite), the correct port, the correct repo name, the required env vars (`DATABASE_URL`, `ORIGIN`, optional `PORT`), and a real `.env.example` (currently referenced but missing).
- **S4**: `package.json` is cleaned up:
  - a real `description` (currently "Blank project with routing included");
  - the placeholder `deploy` script removed;
  - `"undici": "*"` removed if unused;
  - `typescript-plugin-css-modules` pinned instead of `latest`;
  - `engines.node` aligned with the Dockerfile (Node 24).
- **S5**: The schema follows database best practices:
  - foreign keys use `onDelete: "cascade"` (today every FK uses `no action`, per `drizzle/0000_tricky_owl.sql:46-49`);
  - indexes on `user_id` for `free_practice_stats` and `feedbacks`;
  - CHECK constraints for the wpm and accuracy ranges;
  - `timestamp` columns use `withTimezone`.
- **S6**: The `postgres()` pool sets `max`, `idle_timeout` and `max_lifetime` explicitly (`src/db/index.ts:12`).
- **S8**: Containers start node directly (`CMD ["node", "server/entry.express"]`) instead of `pnpm run serve`, which downloads pnpm through Corepack at every start and logs `ERR_PNPM_IGNORED_BUILDS` (observed 2026-10-28, see deploy-migrations L6).
- **S9**: Startup tolerates a briefly unreachable database (retry with backoff before giving up), and the migration advisory lock wait is bounded (`lock_timeout`). It should also fail loudly when the baseline finds only some of the 0000 tables. Source: deploy-migrations L8–L9.
- **S7**: `compose.yml` includes an `app` service, so the production image can be tested end to end locally.

## Tasks

- [x] T1 (S1, S2, S7) `e17d1a5`, `45d7ed9`: Dockerfile, health route, shutdown and compose. Route: inline. Risk: item 5 (deploy), so it needs an independent verifier.
- [x] T2 (S3, S4) `8a9938b`: docs and `package.json`. Route: inline.
- [x] T3 (S5, S6) `a4b3fd2`, `e17d1a5`: schema migration and pool config. Route: inline. Risk: item 1 (migration on existing data), so it needs an independent verifier.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir [...]"
- **L2** (2026-10-28): S8 was done early as part of the security update (branch `chore/security-updates`). The container now runs `node server/entry.express`: startup went from about 13 s to about 1 s, with no runtime pnpm download.
- **L3** (2026-10-28, user): "Dale, continua" (start #9).
- **L4** (2026-10-28): implementation in four units.
  - Runtime (S2, S6, S9), `e17d1a5`:
    - `/health` checks the DB with a 2 s bound. A paused DB used to hang the probe; that was RED, now fixed.
    - SIGTERM/SIGINT shutdown closes the server and then the pool, with a forced exit after 10 s.
    - Startup migrations retry on transient errors only, with backoff 1→15 s over 7 attempts.
    - `lock_timeout` defaults to 60 s.
    - A partial baseline is refused, naming the missing tables.
    - gzip is on, and the pool is max 10, idle 20 s, lifetime 30 min.
  - Docker (S1, S7), `45d7ed9`:
    - A prod-deps stage shrinks the image from 626 MB to 268 MB (node_modules from 301 to 24 MB).
    - HEALTHCHECK via node fetch.
    - compose `app` service waits for a healthy `db`, and CI curls `/health`.
  - Schema (S5), `a4b3fd2`:
    - Cascade FKs, user_id indexes, and range CHECKs added as NOT VALID.
    - timestamptz converted `USING … AT TIME ZONE 'UTC'`. This also fixes a baseline ambiguity: postgres-js read `timestamp` without tz in the process's local zone, so 03:04Z came back as 11:04Z on a UTC-8 machine.
    - Migration 0002 is hand-edited for push-created production (IF EXISTS / IF NOT EXISTS).
  - Docs (S3, S4): README clone URL, three layouts, `.env.example`, a production section and a tests section; real description; template deploy script removed.
- **L5** (2026-10-28): evidence.
  - RED: partial baseline accepted, unbounded lock wait, hanging health check, schema upgrade test. GREEN: 160 tests with `TEST_DATABASE_URL`; tsc, eslint and build are clean; drizzle-kit reports no drift; `pnpm db:migrate` applies 3 migrations.
  - Built server: retries while the DB is down, then starts. `/health` returns 200, or 503 with the DB paused. gzip is on, and SIGTERM exits 0.
  - Slim image: all pages and `/health` return 200, Docker reports "healthy", and `docker stop` exits 0 (baseline exited 137).
  - Risk: items 1 (migration on production data) and 5 (deploy). An independent verifier was launched against a production-like push-created DB.
