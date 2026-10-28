# Latin American Dvorak Variant

Objective: support the Latin American Dvorak layout, with correct punctuation and dead-key guidance.
Branch: `feat/latam-dvorak-variant` · Delivery: ask-on-risk · Test runner: Vitest
Depends on: layout-variant-registry

## Specs

- **S1**: Community request, verbatim: "Sería bueno manejar también la variable de dvorak para latinoamérica. Si bien es cierto que en términos generales es el mismo teclado, los signos de puntuación si cambian ligeramente (¨,´,¿,¡)."
- **S2**: A new variant (proposed id `latam-dvorak-xkb`) appears in the layout selector. It is persisted in `user_settings.layout_variant` and accepted by `/api/layout`.
- **S3**: Key positions come from the authoritative source, not from memory: `/usr/share/X11/xkb/symbols/latam`, variant `dvorak`. Record the source and the xkeyboard-config version in the file header, as `dvorak-layout.ts` already does for `es`. *Assumption, not yet verified:* this XKB variant exists and matches what Latin American users type on. Confirm it with the requester before finalizing.
- **S4**: The on-screen keyboard highlights the correct key or keys for `¿`, `¡`, `´` + vowel and `¨` + `u`/`U` under this variant.
- **S5**: `ñ`/`Ñ` guidance is correct for this variant. Related gap in the existing US Intl variant: its notes say "~ seguida de n", but the composition map in `keyboard.tsx:72` has no `ñ` entry. Fix it in the same feature.
- **S6**: Lessons and exercises that use `¿` and `¡` are typeable and guided under every variant. If a variant has no way to type a character, the UI says so instead of highlighting nothing.

## Tasks

- [x] T1 (S3) `82ea897`: extract the latam dvorak symbols from XKB and add `latamDvorakLayout` with event codes and finger assignments. Route: inline.
- [x] T2 (S2, S4, S5) `82ea897`: register the variant, add its dead-key compositions, and add `ñ` to US Intl. Route: inline.
- [x] T3 (S6) `82ea897`: test that every character in the lesson data resolves to at least one key code for every registered variant. Route: inline.
- [ ] T4: reply to the community comment once this ships.

## Log

- **L1** (2026-10-28, user): "Alguien dejó este comentario como mejora: \"Sería bueno manejar también la variable de dvorak para latinoamérica. Si bien es cierto que en términos generales es el mismo teclado, los signos de puntuación si cambian ligeramente (¨,´,¿,¡). Gran proyecto, llevaba buscándolo un buen rato.\""
- **L2** (2026-10-28, user): "Dale, crea los .md de las cosas a corregir para tener todo documentado como PRD, ARD, o ODD."
- **L3** (2026-10-28, user): "sigue con el #5"
- **L4** (2026-10-28): the S3 assumption is verified. xkeyboard-config `symbols/latam` has the variant `dvorak`, named "Spanish (Latin American, Dvorak)", last changed in commit `b86177c2` (2023-07-04).
  - A diff against `symbols/es` `dvorak` shows exactly 6 changed keys, all punctuation, matching the requester's description:
    - TLDE `| °` (ES `º ª`);
    - AE03 Shift `#` (ES `·`);
    - AE12 `¿ ¡` (ES `¡ ¿`);
    - AD11 `´ ¨` dead keys (ES `` ` ^ ``);
    - AC11 `{ [` (ES `´ ¨`);
    - BKSL `} ]` (ES `ç Ç`).
  - Our ES layout matches XKB on those keys, so LatAm is derived from it by overriding only those six codes.
- **L5** (2026-10-28): decisions.
  - US Intl `ñ`/`Ñ` are now guided as `~` + `n`/`N` (S5).
  - `¿`/`¡` on US Intl need OS-specific AltGr/Option combinations that the on-screen keyboard cannot show. They are declared in `unsupportedChars`, and the keyboard shows a hint in an `aria-live` region (`sr-only` when idle, so the layout does not shift) (S6).
  - The legacy snapshot test excludes only the deliberate US `ñ`/`Ñ` change, which has its own test.
- **L6** (2026-10-28): evidence.
  - RED: 8 tests failed. GREEN: 89/89 with `TEST_DATABASE_URL`; tsc, eslint and build are clean.
  - Built server: `POST /api/layout` with `latam-dvorak-xkb` returns 200 and is stored. `/practica` renders "Dvorak Latinoamérica" and the keycaps `| ° # ¿ ¡ ´ ¨ { [ } ] ñ`. An unknown id returns 400.
  - Not verified end to end: the US Intl hint for `¿`/`¡` in the browser (unit level only).
  - Risk: none. A new variant value is additive, and the existing variants are pinned by the snapshot.
- **L7** (2026-10-28): T4 (reply to the community comment) is pending and belongs to the user.
- **L8** (2026-10-28): native review (lens: reliability, user consent `granted`, lineage `review-de8865cfe1de12a0`): approved and acknowledged. R3-001 (warning, informational): the keyboard hint for unsupported characters has no component-level test. This is the same gap as the "not verified end to end" note in L6, and it is a candidate for tests-and-ci or the accessibility follow-up.
- **L9** (2026-10-28, user): "Corrijamos ese hueco antes de hacer push para que quede todo cubierto". R3-001 is closed in `c0439ca`.
  - `vitest.config.ts` now loads the Qwik optimizer (`qwikVite()` only), so `component$` can be rendered with `createDOM` from `@builder.io/qwik/testing`.
  - `src/components/ui/keyboard.test.tsx` checks two things. On US Intl, `¿`/`¡` show "«X» no tiene una tecla directa en Dvorak US Internacional…" and the region is not `sr-only`. On ES and LatAm (with `¿`/`¡`), on US with a supported character, and with no target, the region stays empty and `sr-only`.
  - The test was written after the code, so it was mutation-checked instead of RED-first. Emptying US `unsupportedChars` makes 2 of 7 fail, and forcing `sr-only` makes 2 of 7 fail; both mutations were reverted.
  - Full suite: 96/96 with `TEST_DATABASE_URL`; tsc, eslint and build are clean.
- **L10** (2026-10-28): native review (lens: reliability, user consent `granted`, lineage `review-9e3c52f30210fef1`): approved and acknowledged. Both test gaps are fixed in `0a2d3e2`:
  - R3-001: the US `ñ`/`Ñ` test now asserts `["Backquote", "KeyL"]` explicitly.
  - R3-002: the typeability check now covers quotes and both word lists, not only lessons.
  - Mutation checks: removing `~` from US Backquote fails the `ñ` test, and dropping `;` from LatAm (a practice-only character) fails the LatAm typeability test. Both were reverted. 87 unit tests pass and tsc and eslint are clean.
