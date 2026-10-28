# Deploy Migrations

Objective: make the deployed database match `src/db/schema.ts`, and apply migrations automatically on every deploy.
Branch: `fix/deploy-migrations` · Delivery: ask-on-risk · Test runner: none yet (see tests-and-ci)

## Specs

- **S1**: A migration creates the `feedbacks` table. Evidence: `src/db/schema.ts:94-104` defines it, but `drizzle/0000_tricky_owl.sql` and `drizzle/meta/0000_snapshot.json` contain no `feedbacks` (0 matches).
- **S2**: Pending migrations are applied on deploy, before the server accepts traffic. Evidence: `.dockerignore:7` excludes `drizzle/`, and no script calls `drizzle-kit migrate` or `migrate()`. The Dockerfile `CMD` only runs `pnpm run serve`.
- **S3**: In production, the app fails fast at startup when `DATABASE_URL` is missing. Evidence: `src/db/index.ts:8-10` silently falls back to `postgres://admin:password@localhost:5432/dvorak_db`.
- **S4**: `package.json` exposes `db:generate` and `db:migrate` scripts. The README stops recommending `drizzle-kit push` for anything but throwaway local databases, because `push` hides missing migrations.

Acceptance: a fresh Postgres plus `docker build` and `docker run` ends with every table from `schema.ts`, and submitting `/sugerencias` returns success.

## Tasks

- [x] T1 (S1) `b691f60`: run `drizzle-kit generate` and commit `drizzle/0001_*.sql` plus its snapshot. Route: inline.
- [x] T2 (S2) `b691f60`: remove `drizzle` from `.dockerignore` and copy `drizzle/` into the final image. Run `migrate()` from `drizzle-orm/postgres-js/migrator` before `listen()` (or as a Railway release command). Route: inline.
- [x] T3 (S3) `b691f60`: throw in `src/db/index.ts` when `NODE_ENV=production` and `DATABASE_URL` is unset. Route: inline.
- [x] T4 (S4) `b691f60`: add the scripts and update the README. Route: inline.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto porque se hizo en unos días y se tiene que mejorar. [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir para tener todo documentado como PRD, ARD, o ODD."
- **L2** (2026-10-28): audit spot check confirmed S1 (`grep -c feedbacks` returns 0) and S2 (`.dockerignore:7` contains `drizzle`).
- **L3** (2026-10-28, user): "empieza con el #1 de migraciones"
- **L4** (2026-10-28): design decisions.
  - Production was likely created with `drizzle-kit push`, so it has the tables but no `drizzle.__drizzle_migrations`. A plain `migrate()` would replay 0000 and crash at startup.
  - `src/db/migrate.ts` therefore baselines 0000 when `public.users` exists and the history is empty. It does this under a `pg_advisory_lock` on a dedicated connection, then calls drizzle `migrate()`, which applies migrations whose journal `when` is greater than the last `created_at` (checked in drizzle-orm 0.45 `pg-core/dialect.js`).
  - `0001` was hand-edited to `CREATE TABLE IF NOT EXISTS` plus a `duplicate_object`-guarded FK, because a pushed production database may already have `feedbacks`.
  - The `DATABASE_URL` check lives in `entry.express.tsx`, not in `db/index.ts`, because `pnpm build` imports `db/index.ts` with `NODE_ENV=production`. The first attempt broke the build.
- **L5** (2026-10-28): evidence. `tsc`, `eslint` and `pnpm build` pass. The image was run against postgres:16 in these states:
  - fresh database: up, 6 tables, 2 history rows;
  - restart: idempotent, 2 history rows;
  - pushed database without `feedbacks`: baselined, `feedbacks` created, existing user preserved;
  - pushed database with `feedbacks`: up;
  - two concurrent instances: both up, 2 history rows;
  - no `DATABASE_URL`: exit 1 with "DATABASE_URL is required in production".
  `pnpm db:migrate` also succeeded twice on a fresh database.
- **L6** (2026-10-28): pre-existing issue, out of scope and moved to ops-and-cleanup. `CMD ["pnpm","run","serve"]` makes Corepack download pnpm 12.x at every container start and log `ERR_PNPM_IGNORED_BUILDS` (`pnpm.onlyBuiltDependencies` is no longer read). The server still starts, but startup is slow and depends on the network. Fix: `CMD ["node","server/entry.express"]`.
- **L7** (2026-10-28): Risk: items 1 and 5. RDD assess returned high and review is due. An independent verifier was launched.
