# Accessibility and SEO

Objective: the tutor is usable with a keyboard and a screen reader, and pages expose correct metadata.
Branch: `fix/accessibility` · Delivery: ask-on-risk · Test runner: Vitest plus manual checks with a screen reader

## Specs

- **S1**: The typing area shows a visible focus state, and errors are not signaled by color alone. Evidence: the input is `opacity-0 w-0 h-0` (`src/components/ui/typing-area.tsx:41`), and errors are color-only (`:59-62`).
- **S2**: Progress and stats are announced through an `aria-live="polite"` region.
- **S3**: The layout selector follows the menu/listbox pattern: `aria-expanded`, `aria-haspopup`, arrow keys and Escape. Evidence: `src/components/ui/header.tsx:78-97` closes on blur with `setTimeout`.
- **S4**: The results modal is a real dialog (`role="dialog"`, `aria-modal`, focus trap, focus restored on close). Evidence: `src/routes/leccion/[id]/index.tsx:214`.
- **S5**: `lang="es"` is set on `<html>`. Evidence: it is on `<body>` at `src/root.tsx:38`.
- **S6**: The canonical URL excludes the query string, and pages include `og:url` and `og:image`. Evidence: `src/components/router-head/router-head.tsx:12`.

## Tasks

- [x] T1 (S1, S2) `28d6ce7`: typing area. Route: inline.
- [x] T2 (S3, S4) `28d6ce7`: header dropdown and results dialog. Route: inline.
- [x] T3 (S5, S6) `28d6ce7`: root and head metadata. Route: inline.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir [...]"
- **L2** (2026-10-28, user): "sigue con el #8"
- **L3** (2026-10-28): findings before the change, from the rendered HTML of a built server.
  - S5 was already met: `<html lang="es">` comes from `containerAttributes` in `entry.ssr.tsx`, so only the redundant `<body lang>` was removed.
  - S6 failed: the canonical kept `?utm=x`, and there was no `og:url`.
  - `og:image` is not done because the repo has no image asset. A 1200×630 image has to be designed first, so it stays open for the user.
- **L4** (2026-10-28): implementation.
  - `LayoutSelector` follows the APG menu button pattern: `aria-haspopup="menu"`, `aria-expanded`, `menuitemradio` with `aria-checked`, focus on the checked item when opening, Arrow, Home and End keys, Escape returns focus, and it closes on focus-out instead of the `setTimeout` blur.
  - `ResultsDialog` is `role="dialog"` with `aria-modal` and `aria-labelledby`. It focuses the primary action on open, traps Tab, and Escape retries. It reuses `Button`, so it looks the same.
  - `TypingArea` has a `focus-within` ring, errors are underlined (wavy) and carry `data-char-state`, and an `sr-only` `role="status"` region announces "Error en el carácter X de N: se esperaba «c»." and "Ejercicio completado.". The visual characters are `aria-hidden`.
  - Canonical and `og:url` come from `canonicalUrl()` (origin + path).
- **L5** (2026-10-28): evidence.
  - RED: the new modules did not exist. GREEN: `a11y.test.tsx` 10/10, and the full suite is 124 passed (with `TEST_DATABASE_URL`). tsc, eslint and build are clean.
  - SSR HTML on the built server: `<html lang="es">`, `<body>`, canonical and og:url `http://…/practica/` without the query string, the menu button collapsed, and the status region present.
  - Real focus and keyboard behavior cannot be proved with createDOM. Risk: item 6. A real-Chromium verifier (keyboard flows plus axe-core, baseline vs candidate) was launched.
- **L6** (2026-10-28): the first browser verifier was cut off by a network error (ENOTFOUND) before reporting. It was resumed on the final candidate.
- **L7** (2026-10-28): native review (lens: reliability, user consent `granted`, lineage `review-069d80b3a7d5a94d`) returned `correction_required` with a CRITICAL inferential finding, R3-focusout-click-race. In Safari and macOS Firefox a click does not focus buttons, so focus fell to `<body>`, focusout closed the menu before the click fired, and mouse selection broke. This was a regression against the baseline's focusable container plus `setTimeout`.
  - Bounded correction `3277509`: the container has `tabIndex={-1}` again and the items have `preventdefault:mousedown`.
  - The provider's targeted validation then approved it, and it was acknowledged.
  - Informational advisories: the keyboard paths are only proved in a real browser; a repeated error was silent; the target text was hidden from AT.
- **L8** (2026-10-28): fixed in `bb5cbb5`, with RED observed first.
  - The hidden input is `aria-describedby` an sr-only "Texto a escribir: …".
  - The status message adds "Errores: N." so a repeated error is announced again.
  - Checks: 13/13 a11y tests and 117 unit tests pass; tsc, eslint and build are clean.
- **L9** (2026-10-28): native review of the corrected candidate (lens: reliability, user consent `granted`, lineage `review-5bf241628b2eb9d5`): approved and acknowledged. Follow-ups in `e75afdd`:
  - R3-002 bug: ArrowUp with no focused item went to the second-to-last item. Now `nextMenuIndex` is a pure, tested function.
  - R3-004: a behavioral `focusout` test, with relatedTarget inside the menu keeping it open and null closing it.
  - R3-001 and R3-003 (focus moves and the dialog Tab trap) cannot be tested in createDOM. A probe showed `focus()` leaves `activeElement` undefined in Qwik's test DOM, contrary to the review's assumption. They are left to the real-browser verifier.
  - Checks: 23 a11y tests and 127 unit tests pass; tsc and eslint are clean.
