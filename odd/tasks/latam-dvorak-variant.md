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

- [ ] T1 (S3): extract the latam dvorak symbols from XKB and add `latamDvorakLayout` with event codes and finger assignments. Route: inline.
- [ ] T2 (S2, S4, S5): register the variant, add its dead-key compositions, and add `ñ` to US Intl. Route: inline.
- [ ] T3 (S6): test that every character in the lesson data resolves to at least one key code for every registered variant. Route: inline.
- [ ] T4: reply to the community comment once this ships.

## Log

- **L1** (2026-10-28, user): "Alguien dejó este comentario como mejora: \"Sería bueno manejar también la variable de dvorak para latinoamérica. Si bien es cierto que en términos generales es el mismo teclado, los signos de puntuación si cambian ligeramente (¨,´,¿,¡). Gran proyecto, llevaba buscándolo un buen rato.\""
- **L2** (2026-10-28, user): "Dale, crea los .md de las cosas a corregir para tener todo documentado como PRD, ARD, o ODD."
