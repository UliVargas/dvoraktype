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

- [ ] T1 (S1): add Vitest with one smoke test. Route: inline.
- [ ] T2 (S2): add the unit tests, in parallel with the features that introduce the code under test. Route: inline.
- [ ] T3 (S3): add the DB integration tests and the Postgres service in CI. Route: inline.
- [ ] T4 (S4, S5): add `.github/workflows/ci.yml`. Route: inline. Risk: item 5 (CI), so it needs an independent verifier.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir [...]"
