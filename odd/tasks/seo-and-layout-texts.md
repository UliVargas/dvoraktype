# SEO and layout-consistent texts

Objective: lesson texts and keys match the selected layout; fix the SEO findings measured on production.
Branch: fix/seo-and-layout-texts. Delivery: commits merged to main on request. Runner: vitest.

## Specs

- S1. "que los textos, así como el teclado visual que se tiene en dos sitios sea concordante con lo que se espera mostrars según la selección": lesson descriptions and keys describe the selected layout (ES, US Intl, Latam); every lesson's exercises are typable with the keys taught so far in that layout; the home text names all three layouts.
- S2. "Temas de SEO": one title and one description per page (no duplicate meta); page-specific `<h1>`; sitemap lists only final, indexable URLs; locked lessons are indexable; og:image, Twitter card, og:locale, og:site_name, JSON-LD; a real web manifest; no `keywords` meta.

## Tasks

- [x] T1 (S1) inline: per-layout lesson overrides, content fixes, typability test. Commit 217bda4.
- [x] T2 (S2) inline: head merge, titles, h1, manifest, og image, JSON-LD, sitemap, locked lesson view. Commit: see L5.

## Log

- L1 (2026-10-28): "Ahora revisemos 2 cosas. 1.- Temas de SEO y que los textos, así como el teclado visual que se tiene en dos sitios sea concordante con lo que se espera mostrars según la selección."
- L2 (2026-10-28): "Haz todas las correcciones de golpe"
- L3: production audit: all pages share the layout `<title>` (the root layout head resolves last and overwrites); description/og meta duplicated; lessons 01-10 return 302 to crawlers but are in the sitemap; /practica and /sugerencias in the sitemap 301; h1 is the logo; /og.png 404; manifest is the Qwik template. Lessons are written for es-dvorak-xkb only (L0 "D R T N S", L1 uses r, L3 keys ´ ç, L5 H note, L9 ´ dead key); L3/L4/L6 exercises also use keys taught later (l, q, m) even in ES.
- L4: T1 RED: 7 failing tests (untaught chars in L3-E3, L4-E2..E4, L6-E2, L6-E3 on every layout; ´ and ç missing on US, ç on Latam; intro/accents texts). GREEN after overrides; suite 192 passed.
- L5: T2 checked on the built server with a fresh Postgres and no cookie: every page has its own title and exactly one description, og:title, og:image, twitter:card, og:locale, no keywords, one h1; /leccion/leccion-05/ returns 200 with the locked view (was 302); /og-image.png and /manifest.json 200; home has one JSON-LD script. The save action still answers 403 for locked lessons.
