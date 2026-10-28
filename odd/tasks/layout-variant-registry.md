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

- [x] T1 (S6) `a2baf96`: snapshot test of the target codes for every character in `src/data/lessons/es.ts`, under both variants, taken before the refactor. Route: inline.
- [x] T2 (S1, S2, S3) `a2baf96`: introduce the registry, move the composition maps out of `keyboard.tsx`, and replace the literal comparisons. Route: inline.
- [x] T3 (S4, S5) `a2baf96`: fix or remove the merged lookup map and the unused helpers. Route: inline.

## Log

- **L1** (2026-10-28, user): "Haz un analisis de las mejoras que puede tener este proyecto [...] Para eso aplcica una auditoría." Follow-up: "Dale, crea los .md de las cosas a corregir [...]"
- **L2** (2026-10-28): this refactor is a prerequisite for latam-dvorak-variant.
- **L3** (2026-10-28, user): "sigue con el #4"
- **L4** (2026-10-28): implementation.
  - Snapshot: `src/data/__fixtures__/legacy-key-codes.json` was generated from a verbatim copy of the pre-refactor `keyboard.tsx` logic (temporary generator, deleted afterwards). It covers 58 characters per variant from lessons, quotes and word lists.
  - The snapshot shows US Intl highlights nothing for `ñ`, `¿` and `¡`. That gap stays as-is (S6) and belongs to latam-dvorak-variant S5–S6.
  - The header selector maps over `LAYOUT_VARIANT_IDS` with the same labels ("Dvorak Español"/"Dvorak US Int." in the menu, and the layout name on the button).
  - Unknown stored variants now fall back to the default layout. Before, the header ternary showed the US label.
- **L5** (2026-10-28): evidence.
  - RED: the registry module did not exist. GREEN: 79/79 with `TEST_DATABASE_URL`; tsc, eslint and build are clean. There are 0 variant string comparisons left in `.tsx` files.
  - Built server: `/`, the lesson page and `/practica` render the label matching the stored variant before and after `POST /api/layout`, and an unknown stored value renders the default.
  - Risk: none. No high-risk item applies, and the shared highlighting behavior is pinned by the snapshot.
- **L6** (2026-10-28): native review (lens: reliability, user consent `granted`, lineage `review-c341a643d49f4ce1`): approved and acknowledged. Follow-ups applied:
  - R3-snapshot-composition-gap: the snapshot now also covers `Á É Í Ó Ú ü Ü` (65 characters per variant), generated from the pre-refactor `keyboard.tsx` at `f5ff411`.
  - R3-unknown-variant-throws: `getKeyCodesForChar` falls back to the default layout. RED was observed with a TypeError, then GREEN.
  R3-loader-fallback-untested is noted only; the registry-level fallback is unit-tested.
