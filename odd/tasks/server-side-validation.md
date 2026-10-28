# Server-Side Validation of Progress

Objective: the server, not the client, decides whether an exercise or lesson is passed. Every progress write is validated and race-free.
Branch: `fix/server-side-validation` · Delivery: ask-on-risk · Test runner: Vitest (introduced by tests-and-ci T1)

## Specs

- **S1**: `useSaveExercise` validates its input with `zod$`. `lessonId` and `exerciseId` must exist in the lesson data. `wpm` must be an integer from 0 to 300 and `accuracy` an integer from 0 to 100. Invalid input is rejected with a validation error, not a 500. Evidence: `src/routes/leccion/[id]/index.tsx:53-66` uses `as string`, `Number(...)` and `as any`.
- **S2**: The server computes `passed` and `isLastExercise` from the lesson's `requiredWpm` and `requiredAccuracy` and the exercise order. Client-sent values are ignored. Evidence: same lines trust `data.passed === "true"`.
- **S3**: The free-practice action (`src/routes/practica/index.tsx:13-24`) validates with bounded numbers in the same way.
- **S4**: Retrying a passed exercise never un-passes it. Evidence: `src/server/progress.service.ts:90` sets `passed: passed` on conflict.
- **S5**: Concurrent saves do not lose updates. `attempts`, `bestWpm` and `bestAccuracy` are computed in SQL inside the upsert (`attempts + 1`, `GREATEST(...)`). Evidence: read-then-write at `progress.service.ts:98-123`.
- **S6**: `ensureUser` is idempotent under concurrency (`insert ... onConflictDoNothing()`). Evidence: SELECT followed by INSERT at `progress.service.ts:16-20`.
- **S7**: A locked lesson cannot be opened or saved by URL. The `/leccion/[id]` loader and action check that the previous lesson is completed. Evidence: the lock is client-only, at `src/routes/index.tsx:115`.

Acceptance: a crafted POST with `passed=true`, `wpm=NaN` or an unknown `lessonId` is rejected without changing any rows.

## Tasks

- [ ] T1 (S1, S2): zod schema plus server-side pass computation in `leccion/[id]`. Route: inline.
- [ ] T2 (S3): zod schema in `practica`. Route: inline.
- [ ] T3 (S4, S5, S6): rewrite the upserts in `progress.service.ts` with SQL expressions. Route: inline. Risk: item 4 (concurrency), so it needs an independent verifier.
- [ ] T4 (S7): enforce the lesson lock on the server. Route: inline.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir [...]"
- **L2** (2026-10-28): audit spot check confirmed S1 and S2 at `leccion/[id]/index.tsx:53-66`.
- **L3** (2026-10-28, user): "Antes haz un hotfix sobre main porque me sale este error que no se a que se deba" (production logs: `duplicate key value violates unique constraint "users_pkey"` from `ensureUser`, under `Promise.all` of `getUserSettings` and `getAllLessonProgress`).
- **L4** (2026-10-28): S6 is done in hotfix `a14847a` on `main` (`insert ... onConflictDoNothing`). The fix was checked against a throwaway Postgres 16 by running 50 first visits, each firing both loaders in parallel: 50 of 50 rejected before the fix, 0 after, and no duplicate users. `tsc` and `eslint` were clean. T3 still covers S4 and S5.
