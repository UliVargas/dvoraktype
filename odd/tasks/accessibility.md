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

- [ ] T1 (S1, S2): typing area. Route: inline.
- [ ] T2 (S3, S4): header dropdown and results dialog. Route: inline.
- [ ] T3 (S5, S6): root and head metadata. Route: inline.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir [...]"
