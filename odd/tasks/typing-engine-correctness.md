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
