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

- [ ] T1 (S4): extract the metric math into a pure module, with tests. Route: inline.
- [ ] T2 (S1, S3): make `processChar` a plain synchronous function and add NFC normalization. Route: inline.
- [ ] T3 (S2): rewrite dead-key handling, then test manually on macOS, Windows and Linux/XKB, each with ES and US Intl. Route: inline. Risk: item 6 (no automated test covers real IME behavior), so it needs an independent verifier.
- [ ] T4 (S5, S6): Route: inline.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir [...]"
