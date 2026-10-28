# Tests and CI

Objective: create a safety net so the other features can be changed with confidence.
Branch: `chore/tests-and-ci` · Delivery: ask-on-risk · Test runner: Vitest (to be added)

## Specs

- **S1**: Vitest is installed, `pnpm test` runs it, and it works with the Qwik and Vite config. Evidence: there is no test runner and there are no test files today.
- **S2**: Unit tests cover the typing metrics, the server-side pass computation (server-side-validation S2) and the layout character → key resolution (layout-variant-registry).
- **S3**: Integration tests for `progress.service.ts` run against a real Postgres (a CI service container), covering the upserts and concurrency (server-side-validation S4–S6).
- **S4**: A GitHub Actions workflow runs `lint`, `build.types`, `test` and `build` on every PR and on pushes to `main`.
- **S5**: CI builds the Docker image, to catch issues like the `.dockerignore` problem that broke migrations.

## Tasks

- [x] T1 (S1) `2150655`: add Vitest with one smoke test. Route: inline.
- [x] T2 (S2): unit tests exist for the typing metrics (`src/hooks/typing-session.test.ts`), the server-side pass computation (`src/server/progress-rules.test.ts`) and per-layout key resolution (`src/data/layout-registry.test.ts`). Route: inline.
- [x] T3 (S3) `b94eb13`: `src/server/progress.service.test.ts` runs against the CI Postgres service, and fails in CI if `TEST_DATABASE_URL` is missing. Route: inline.
- [x] T4 (S4, S5) `b94eb13`, `13edb60`: `.github/workflows/ci.yml` is implemented and replayed locally. It stays open until a real GitHub Actions run passes. Route: inline. Risk: item 5 (CI), so it needs an independent verifier.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir [...]"
- **L2** (2026-10-28): component tests are now possible. `vitest.config.ts` loads `qwikVite()`, and `.test.tsx` files can render components with `createDOM` from `@builder.io/qwik/testing` (first one: `src/components/ui/keyboard.test.tsx`, `c0439ca`).
- **L3** (2026-10-28, user): "sigue con el #7"
- **L4** (2026-10-28): decisions.
  - Actions are pinned to their current majors (checkout v7, setup-node v7, pnpm/action-setup v6, setup-buildx v4, build-push v7), all on the `node24` runtime, with the latest tags checked via the GitHub API.
  - `packageManager: "pnpm@12.10.1"` pins pnpm for CI and for Corepack in the Docker build. pnpm 12 also records it in the lockfile; the first replay failed `--frozen-lockfile` until the lockfile was updated, which is exactly the class of drift CI should catch.
  - The docker job boots the image against Postgres and requests pages, instead of only building it, because the original `.dockerignore` bug only surfaced at runtime. It also asserts the image runs the Node version in `.node-version`.
  - The DB suite fails in CI without `TEST_DATABASE_URL` instead of skipping silently.
- **L5** (2026-10-28): evidence.
  - YAML parses (js-yaml). actionlint could not run because downloading and executing it was denied by the permission system.
  - Clean-archive replay of `check` with `CI=true` and Postgres: install, lint, typecheck, test (114 passed, 1 skipped = the guard) and build all exit 0.
  - Replay of `docker`: the image boots, `/` and `/sugerencias/` return 200, and node is v24.22.1, matching `.node-version`.
  - Mutation: adding `drizzle` back to `.dockerignore` fails the image build.
  - Not verified yet: a real GitHub Actions run. It will happen on the first push to `main`.
- **L6** (2026-10-28): native review (4 lenses because the risk was high; user consent `granted`; lineage `review-910fcfd687284398`): approved and acknowledged. Applied in `13edb60`:
  - R1-unpinned-action-tags: actions are pinned to full commit SHAs resolved from the GitHub API (checkout `3d3c42e` v7.0.1, pnpm/action-setup `ea17c68` v6.1.0, setup-node `949feb2` v7.1.0, setup-buildx `f87e599` v4.4.1, build-push `c3c9e26` v7.4.0).
  - R3-001 and R2-001: the boot step fails explicitly with `::error::The image did not boot …` after 60 s or a container exit. This was exercised locally with an image that exits with code 3.
  - R3-002: `cancel-in-progress` only applies to pull requests.
  - R3-003: the guard checks `CI === "true"`.
  - R2-002: a comment says the two Postgres services must stay identical. YAML anchors were not used.
  - R3-004 accepted: T4 was reopened until a real Actions run passes.
- **L7** (2026-10-28): independent verifier verdict on `b94eb13`: PASS with no blockers. It checked against primary docs and replays:
  - `pnpm/action-setup@v6` reads `packageManager` and must run before `setup-node` with `cache: pnpm`, which is the order used.
  - `node-version-file` is supported, and the service is reachable on `localhost:5432` (also with `--network host`).
  - `load: true` with tags makes the image available locally, and the `gha` cache needs no extra permissions.
  - The guard was confirmed for CI-only, local and both. The pnpm pin changes the image's pnpm from 12.16.1 to 12.10.1, matching the lockfile.
  - A wrong DB password fails the boot step.
- **L8** (2026-10-28): native review of the follow-ups (4 lenses, user consent `granted`, lineage `review-b2b667d16a27fba3`): approved and acknowledged. Fixed in `931a800`:
  - R4/R3 concurrency: GitHub keeps one pending run per group, so the group is now per commit on main and per ref on PRs.
  - R4-no-job-timeout: `timeout-minutes: 20` on both jobs.
  - R2-boot-readiness-coupling: a comment points to `app.listen` in `src/entry.express.tsx`.
  The YAML parses.
- **L9** (2026-10-28, user): "haz merge y push cuando termine el verificador". T4 closes once the first GitHub Actions run on `main` passes.
- **L10** (2026-10-28): the first real GitHub Actions run on `main` (`b7cea5b`, run 40716387858) succeeded. Both jobs passed: "Lint, types, tests and build" and "Docker image boots and serves". T4 is closed.
