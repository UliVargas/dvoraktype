# Layout Variant Registry

Objective: make keyboard layout variants data-driven. Adding a layout should mean adding one file, not editing about 6.
Branch: `refactor/layout-variant-registry` · Delivery: ask-on-risk · Test runner: Vitest

## Specs

- **S1**: A single registry maps each `LayoutVariant` to `{ layout: KeyboardLayout, deadKeyCompositions: Record<string, string[]>, config: LayoutVariantConfig }`. Every consumer reads from it.
- **S2**: No component, route or API compares variant string literals. Today there are 11 literal comparisons in `.tsx` files, including ternaries at `src/routes/index.tsx:47` and `src/routes/practica/index.tsx:36`, `if` chains at `src/components/ui/keyboard.tsx:50` and `:72`, and a hardcoded allow-list at `src/routes/api/layout/index.ts:14`.
- **S3**: Validation (the API and zod schemas) derives the allowed variants from the registry keys.
- **S4**: Character → key and finger lookups are per layout. Evidence: `charToKeyMap` in `src/data/dvorak-layout.ts` merges the ES and US keys, and US entries overwrite ES ones for shared characters, which gives the wrong finger. `getKeyForChar` and `getFingerForChar` are currently unused, so either make them layout-scoped or delete them.
- **S5**: Unused helpers in `src/data/layout-variants.ts` are either wired in or removed. `detectLayoutVariant`, `getLayoutVariantConfig` and `LAYOUT_VARIANTS` are referenced only within that file. If detection is kept, it must not classify Android as XKB (Android user agents contain "linux").
- **S6**: Behavior is unchanged for `es-dvorak-xkb` and `us-dvorak-intl`: the same highlighted keys for every character in the existing lessons.

## Tasks

- [ ] T1 (S6): snapshot test of the target codes for every character in `src/data/lessons/es.ts`, under both variants, taken before the refactor. Route: inline.
- [ ] T2 (S1, S2, S3): introduce the registry, move the composition maps out of `keyboard.tsx`, and replace the literal comparisons. Route: inline.
- [ ] T3 (S4, S5): fix or remove the merged lookup map and the unused helpers. Route: inline.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir [...]"
- **L2** (2026-10-28): this refactor is a prerequisite for latam-dvorak-variant.
