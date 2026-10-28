import { describe, expect, it } from "vitest";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, pageHead, siteHead } from "./seo";

const contentOf = (meta: readonly { key?: string; content?: string }[], key: string) =>
  meta.filter((m) => m.key === key).map((m) => m.content);

describe("pageHead", () => {
  it("sets the title and one description, og:title and og:description", () => {
    const head = pageHead("Práctica | DvorakType", "Practica Dvorak.");
    expect(head.title).toBe("Práctica | DvorakType");
    expect(contentOf(head.meta, "description")).toEqual(["Practica Dvorak."]);
    expect(contentOf(head.meta, "og:title")).toEqual(["Práctica | DvorakType"]);
    expect(contentOf(head.meta, "og:description")).toEqual(["Practica Dvorak."]);
  });
});

describe("siteHead", () => {
  it("keeps the page's title and description instead of overwriting them", () => {
    const page = pageHead("Lección | DvorakType", "Texto de la lección.");
    const site = siteHead(page, "https://dvoraktype.com");
    expect(site.title).toBe("Lección | DvorakType");
    expect(contentOf(site.meta, "description")).toEqual([]);
    expect(contentOf(site.meta, "og:title")).toEqual([]);
  });

  it("fills in the default title and description when the page sets none", () => {
    const site = siteHead({ title: "", meta: [] }, "https://dvoraktype.com");
    expect(site.title).toBe(DEFAULT_TITLE);
    expect(contentOf(site.meta, "description")).toEqual([DEFAULT_DESCRIPTION]);
    expect(contentOf(site.meta, "og:title")).toEqual([DEFAULT_TITLE]);
  });

  it("adds the share image as an absolute URL, the site name, locale and Twitter card", () => {
    const site = siteHead({ title: "", meta: [] }, "https://dvoraktype.com");
    expect(contentOf(site.meta, "og:image")).toEqual(["https://dvoraktype.com/og-image.png"]);
    expect(contentOf(site.meta, "og:site_name")).toEqual(["DvorakType"]);
    expect(contentOf(site.meta, "og:locale")).toEqual(["es_ES"]);
    expect(contentOf(site.meta, "twitter:card")).toEqual(["summary_large_image"]);
  });

  it("gives every tag a key, so Qwik never emits one twice", () => {
    const site = siteHead({ title: "", meta: [] }, "https://dvoraktype.com");
    const keys = site.meta.map((m) => m.key);
    expect(keys.every((k) => typeof k === "string")).toBe(true);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
