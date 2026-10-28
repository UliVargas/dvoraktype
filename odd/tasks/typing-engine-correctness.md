# Typing Engine Correctness

Objective: make input handling reliable across operating systems, input methods and dead keys.
Branch: `fix/typing-engine-correctness` · Delivery: ask-on-risk · Test runner: Vitest

## Specs

- **S1**: Multi-character input (composition, paste) is processed strictly in order, and `onComplete$` fires only after the last character. Evidence: `processChar` is a `$()` QRL called in loops without `await` (`src/hooks/use-typing-engine.ts:130-132`, `152-154`).
- **S2**: Dead-key input is never dropped. Rely on `InputEvent.isComposing` and `inputType` instead of the keydown `"Dead"` flag. Evidence: `use-typing-engine.ts:147-149` clears input while `deadKeyPending` is set, so a composed `á` delivered as a plain `input` event is lost.
- **S3**: Target text and typed input are both normalized to NFC before comparison, so NFD input (`a` + U+0301) matches `á`. Evidence: char-by-char comparison at `use-typing-engine.ts:65`.
- **S4**: The metric definitions are documented and tested: WPM, accuracy (`correct / totalKeystrokes`), errors, and the timer starting on the first keystroke (`:57-58`).
- **S5**: `getLessonState` (`src/server/progress.service.ts:53-64`) returns an explicit state when all exercises are complete. Today it only works by accident.
- **S6** (performance): a keystroke re-renders only the changed character, not the full text. Evidence: `src/components/ui/typing-area.tsx:55`, and `charStates` is copied on every keystroke at `use-typing-engine.ts:63`.

## Tasks

- [x] T1 (S4) `f0d8530`: extract the metric math into a pure module, with tests. Route: inline.
- [x] T2 (S1, S3) `f0d8530`: make `processChar` a plain synchronous function and add NFC normalization. Route: inline.
- [x] T3 (S2) `f0d8530`: rewrite dead-key handling, then test manually on macOS, Windows and Linux/XKB, each with ES and US Intl. Route: inline. Risk: item 6 (no automated test covers real IME behavior), so it needs an independent verifier.
- [x] T4 (S5, S6) `f0d8530`: Route: inline.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir [...]"
- **L2** (2026-10-28, user): "sigue con el #6"
- **L3** (2026-10-28): implementation.
  - `src/hooks/typing-session.ts` is a framework-free core: `createTypingSession`, `typeText` (synchronous, in order, NFC, stops at finish) and `computeStats`, with the metric definitions documented in its header (S1, S3, S4).
  - The Qwik hook calls the core from a single `consumeInput$` that reads and empties the hidden input, so a late duplicate event finds nothing.
  - The keydown `"Dead"` flag is gone. Input is skipped only while `InputEvent.isComposing` or a composition is active, and `compositionend` falls back to `data` (S2).
  - `charStates` is mutated in place instead of copied per keystroke. The component still maps every character on render, so S6 is only partly addressed: there is no per-character component yet.
  - `getLessonState` returns `isComplete` explicitly (S5).
- **L4** (2026-10-28): evidence.
  - RED at component level on the old engine (`typing-area.test.tsx`, createDOM): "á" as plain input after keydown `Dead` was dropped, and NFD `o\u0301` did not match `ó`. Composition and paste already worked and stay as safety nets.
  - RED for the core module (missing) and for `isComplete`.
  - GREEN: 111/111 with `TEST_DATABASE_URL`; tsc, eslint and build are clean.
  - Risk: item 6, because real OS IME and dead-key behavior is beyond synthetic events. A real-Chromium verifier (CDP IME and insertText, baseline vs candidate) was launched. Manual checks on macOS, Windows and Linux are still the user's to do.
- **L5** (2026-10-28): native review (lens: reliability, user consent `granted`, lineage `review-0494645ea27857c4`): approved and acknowledged. Both findings are fixed in `3e39307`, with RED observed first in `typing-area.test.tsx`:
  - R3-post-finish-stats: input after completion is ignored, so the live stats equal the reported ones. Before the fix, the live elapsedTime moved after finishing.
  - R3-stale-target-chars: a new `targetText` restarts the session even with the same `resetKey`.
  - The first fix attempt silently did not apply, because a failing `grep -c` short-circuited the `&&` chain. It was re-run and confirmed by GREEN.
  - Checks: 103 unit tests pass (DB tests skipped, unaffected); tsc and eslint are clean.
- **L6** (2026-10-28): real-Chromium verifier (CDP, baseline `8782735` vs candidate `f0d8530`): PASS with no blockers.
  - S1: a pasted quote was scrambled at baseline (6 correct, 99 errors) and is processed in order now, completing once.
  - S2: keydown `Dead` followed by `insertText "é"` was dropped at baseline and advances now. IME composition works on both, with no double processing.
  - S3: NFD `insertText` was an error at baseline and is correct now.
  - S4: the result screen (2 errors, 92% = 23/25) and saved rows match the baseline shape.
  - S5: the lesson opens on the same exercise in every seeded state.
  - S6 is NOT met at DOM level. A MutationObserver counted about 145 identical text writes per keystroke on a 177-character quote, the same as baseline. Dropping the array copy is not enough; per-character rendering is still pending.
  Advisory: pasted WPM is rejected by the schema, so no row is saved (also at baseline). Real OS IME on macOS, Windows and Linux, and Safari/Firefox event order, still need manual checks.
- **L7** (2026-10-28): native review of the full #6 (lens: reliability, user consent `granted`, lineage `review-96ebcdd86f4103e7`): approved and acknowledged. Fixed in `c6530cd`:
  - R3-compositionend-data-fallback-untested: a new component test covers it. Mutation check: removing the fallback makes it fail.
  - R3-nfd-literals-not-explicit: the tests held raw combining characters, not escapes. My earlier claim that they used escapes was wrong (a false-positive `grep -F` with a backslash). They are now `\u0301`/`\u0308` escapes, and both test files are verified NFC with precomposed targets.
  - Checks: 104 unit tests pass; tsc and eslint are clean.
- **L8** (2026-10-28, user): "haz merge y push cuando termine el verificador".
- **L9** (2026-10-28, user): "sigue con la mejora del redibujado por carácter".
  - `baa9c40`: each character is now a `TypingChar` component with primitive props (char, state, isCurrent), with identical markup. `116ff5b` pins that markup with 7 tests, mutation-checked against a cursor that is always drawn.
  - Native review (lineage `review-70fb8109b6d08806`, user consent `granted`): approved and acknowledged.
- **L10** (2026-10-28): real-Chromium measurement, MutationObserver on `.wrap-break-word`, main `04ed107` vs candidate. **S6 is met.**
  - Steady-state keystrokes touch 1–2 spans with 3–8 mutation records, versus about 97 spans and 100 records on a 111-char quote at main. The lesson page drops from about 20 spans to 2.
  - The first keystroke has a one-time burst of childList records at the root. Script time is unchanged (about 0.2–0.4 ms), and no extra q-*.js is fetched.
  - Parity: DOM snapshots and mid-typing screenshots are identical; cursor, errors, completion, stats and retry all behave the same.
  - Observed but not investigated: at a 30 ms typing delay main drops or misorders keystrokes (53% accuracy), while the candidate completes at 99%.
