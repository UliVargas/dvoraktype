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
- **S7**: `compose.yml` includes an `app` service, so the production image can be tested end to end locally.

## Tasks

- [ ] T1 (S1, S2, S7): Dockerfile, health route, shutdown and compose. Route: inline. Risk: item 5 (deploy), so it needs an independent verifier.
- [ ] T2 (S3, S4): docs and `package.json`. Route: inline.
- [ ] T3 (S5, S6): schema migration and pool config. Route: inline. Risk: item 1 (migration on existing data), so it needs an independent verifier.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir [...]"
