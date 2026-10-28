export const SITE_NAME = "DvorakType";
export const DEFAULT_TITLE = "DvorakType | Aprende mecanografía Dvorak en español";
export const DEFAULT_DESCRIPTION =
  "Aprende el teclado Dvorak en español gratis, con lecciones interactivas " +
  "para Dvorak Español, Latinoamericano y US Internacional y práctica libre.";

interface MetaTag {
  readonly key?: string;
  readonly name?: string;
  readonly property?: string;
  readonly content?: string;
}

/** A page's title, description and their Open Graph copies. */
export function pageHead(title: string, description: string) {
  return {
    title,
    meta: [
      { key: "description", name: "description", content: description },
      { key: "og:title", property: "og:title", content: title },
      { key: "og:description", property: "og:description", content: description },
    ],
  };
}

/**
 * Site-wide tags for the root layout. Qwik City resolves the root layout's
 * head last, so it only fills in the title and description a page left out
 * instead of replacing them.
 */
export function siteHead(
  head: { readonly title: string; readonly meta: readonly MetaTag[] },
  origin: string,
) {
  const defaults = pageHead(DEFAULT_TITLE, DEFAULT_DESCRIPTION);
  const pageSet = (key: string) => head.meta.some((m) => m.key === key);
  return {
    title: head.title || defaults.title,
    meta: [
      ...defaults.meta.filter((m) => !pageSet(m.key)),
      { key: "og:type", property: "og:type", content: "website" },
      { key: "og:site_name", property: "og:site_name", content: SITE_NAME },
      { key: "og:locale", property: "og:locale", content: "es_ES" },
      { key: "og:image", property: "og:image", content: `${origin}/og-image.png` },
      { key: "og:image:width", property: "og:image:width", content: "1200" },
      { key: "og:image:height", property: "og:image:height", content: "630" },
      {
        key: "og:image:alt",
        property: "og:image:alt",
        content: "DvorakType: aprende mecanografía Dvorak en español",
      },
      { key: "twitter:card", name: "twitter:card", content: "summary_large_image" },
      { key: "author", name: "author", content: "Ulises Vargas" },
    ],
  };
}
