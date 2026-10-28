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

- [x] T1 (S1, S2) `4b26f69`: zod schema plus server-side pass computation in `leccion/[id]`. Route: inline.
- [x] T2 (S3) `4b26f69`: zod schema in `practica`. Route: inline.
- [x] T3 (S4, S5, S6) `4b26f69` (S6 in `a14847a`): rewrite the upserts in `progress.service.ts` with SQL expressions. Route: inline. Risk: item 4 (concurrency), so it needs an independent verifier.
- [x] T4 (S7) `4b26f69`: enforce the lesson lock on the server. Route: inline.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir [...]"
- **L2** (2026-10-28): audit spot check confirmed S1 and S2 at `leccion/[id]/index.tsx:53-66`.
- **L3** (2026-10-28, user): "Antes haz un hotfix sobre main porque me sale este error que no se a que se deba" (production logs: `duplicate key value violates unique constraint "users_pkey"` from `ensureUser`, under `Promise.all` of `getUserSettings` and `getAllLessonProgress`).
- **L4** (2026-10-28): S6 is done in hotfix `a14847a` on `main` (`insert ... onConflictDoNothing`). The fix was checked against a throwaway Postgres 16 by running 50 first visits, each firing both loaders in parallel: 50 of 50 rejected before the fix, 0 after, and no duplicate users. `tsc` and `eslint` were clean. T3 still covers S4 and S5.
- **L5** (2026-10-28, user): "Dale" (start with Vitest, then this feature).
- **L6** (2026-10-28): decisions.
  - The rules live in the pure module `src/server/progress-rules.ts`: the zod schemas, `evaluateExercise` and `isLessonUnlocked`.
  - `zod` was promoted from a transitive to a direct dependency, pinned to the same 3.25.48 already in the lockfile. Importing `z` from `@builder.io/qwik-city` breaks outside Vite with `Invalid module "@qwik-city-plan"`.
  - A lesson now completes only when every exercise has passed. Previously, passing the last exercise was enough, which a server that no longer trusts the client would let anyone exploit. Lessons that were already completed stay completed, because `completed` is OR-ed.
- **L7** (2026-10-28): RED observed before the fix, against postgres:16. Failures included 10 concurrent saves leaving `attempts=3`, passed exercises being lost on retry, unknown exercises being accepted, and `isLessonUnlocked` not existing yet. The new "only the last exercise passed" test was written before the implementation, but its RED was not run separately.
- **L8** (2026-10-28): GREEN.
  - `pnpm test`: 31/31 with `TEST_DATABASE_URL`, and 22 passed plus 9 skipped without it.
  - `tsc`, `eslint` and `pnpm build` are clean.
  - HTTP against the built server:
    - lesson action: `passed=true` with failing stats returns 200 but stores `passed=false`;
    - NaN, 99999 and an unknown exercise each return 400;
    - a locked lesson returns 403 and writes 0 rows;
    - a real pass completes the lesson and unlocks the next one, and rejected requests add no attempts;
    - a GET of a locked lesson returns 302 to `/`;
    - practice: NaN and accuracy 150 return 400, and a valid submission returns 200 and stores the row.
- **L9** (2026-10-28): Risk: items 2 (guards), 4 (concurrency) and 5 (dependencies). An independent verifier was launched.
- **L10** (2026-10-28): independent verifier verdict: PASS for S1–S7 with no blockers.
  - It compared the candidate against a baseline build: NaN, 20.5, 99999, an unknown exercise and an unknown lesson are all rejected, where the baseline returned 500 or stored them.
  - A forged pass is stored as `passed=false`.
  - In 200 rounds of concurrent pass and fail saves across a whole lesson, there were 0 lost completions and 0 bad attempt counts.
  - Real Chromium end to end: the lesson is completed and the next one unlocks.
  - Users with progress saved by the old code do not regress.
  Advisories:
  - The lesson UI never reads the action result, so a server rejection (400 or 403) is invisible. The client also still navigates on its local pass preview, which can land on a locked lesson and get a silent 302 to `/`.
  - `z.coerce` turns an empty string into 0.
  - The 1-hour cap on free-practice time.
  - `evaluateExercise.isLastExercise` is unused now that completion requires every exercise.
- **L11** (2026-10-28): native review and the merge are on hold. The user prioritized the Node.js and dependency security update (`chore/security-updates`). This branch will be rebased onto it and re-checked before review.
