import { describe, expect, it } from "vitest";
import legacyKeyCodes from "./__fixtures__/legacy-key-codes.json";
import { lessons } from "./lessons";
import { quotesEs } from "./quotes";
import { commonWordsEn, commonWordsEs } from "./words";
import {
  DEFAULT_LAYOUT,
  LAYOUT_VARIANT_IDS,
  getKeyCodesForChar,
  getLayoutDefinition,
  isLayoutVariant,
} from "./layout-registry";
import type { LayoutVariant } from "./types";

describe("layout registry", () => {
  it("registers every layout variant with its own layout", () => {
    expect(LAYOUT_VARIANT_IDS).toEqual([
      "es-dvorak-xkb",
      "us-dvorak-intl",
      "latam-dvorak-xkb",
    ]);
    for (const variant of LAYOUT_VARIANT_IDS) {
      expect(getLayoutDefinition(variant).layout.variant).toBe(variant);
    }
  });

  it("keeps the UI labels used before the refactor", () => {
    expect(getLayoutDefinition("es-dvorak-xkb").layout.name).toBe("Dvorak Español");
    expect(getLayoutDefinition("es-dvorak-xkb").menuLabel).toBe("Dvorak Español");
    expect(getLayoutDefinition("us-dvorak-intl").layout.name).toBe("Dvorak US Internacional");
    expect(getLayoutDefinition("us-dvorak-intl").menuLabel).toBe("Dvorak US Int.");
  });

  it("validates variant ids from the registry keys", () => {
    expect(isLayoutVariant("es-dvorak-xkb")).toBe(true);
    expect(isLayoutVariant("us-dvorak-intl")).toBe(true);
    expect(isLayoutVariant("qwerty")).toBe(false);
    expect(isLayoutVariant(undefined)).toBe(false);
  });

  it("falls back to the default layout for unknown ids", () => {
    expect(DEFAULT_LAYOUT).toBe("es-dvorak-xkb");
    expect(getLayoutDefinition("qwerty").layout.variant).toBe(DEFAULT_LAYOUT);
  });
});

describe("getKeyCodesForChar", () => {
  // Deliberate changes to the snapshot below, each with its own test
  const intendedChanges: Record<string, readonly string[]> = {
    "us-dvorak-intl": ["ñ", "Ñ"],
  };

  // Snapshot of the pre-refactor highlight logic for every character in the
  // lessons, quotes and word lists: the refactor must not change it.
  for (const [variant, byChar] of Object.entries(legacyKeyCodes)) {
    it(`highlights the same keys as before for ${variant}`, () => {
      for (const [char, codes] of Object.entries(byChar)) {
        if (intendedChanges[variant]?.includes(char)) continue;
        expect([char, getKeyCodesForChar(variant as LayoutVariant, char)]).toEqual([char, codes]);
      }
    });
  }

  it("resolves characters within the selected layout only", () => {
    // R is on the home row in ES XKB and on the top row in US Dvorak
    expect(getKeyCodesForChar("es-dvorak-xkb", "r")).not.toEqual(
      getKeyCodesForChar("us-dvorak-intl", "r"),
    );
  });

  it("degrades to the default layout for an unregistered variant", () => {
    const unknown = "qwerty" as LayoutVariant;
    expect(getKeyCodesForChar(unknown, "a")).toEqual(getKeyCodesForChar(DEFAULT_LAYOUT, "a"));
  });

  it("returns nothing for empty input or unknown characters", () => {
    expect(getKeyCodesForChar("es-dvorak-xkb", "")).toEqual([]);
    expect(getKeyCodesForChar("es-dvorak-xkb", "€")).toEqual([]);
  });
});

describe("Latin American Dvorak (XKB latam dvorak)", () => {
  const latam = "latam-dvorak-xkb";

  it("is registered with its own label", () => {
    expect(getLayoutDefinition(latam).layout.variant).toBe(latam);
    expect(getLayoutDefinition(latam).layout.name).toBe("Dvorak Latinoamérica");
    expect(getLayoutDefinition(latam).menuLabel).toBe("Dvorak Latam");
  });

  // "los signos de puntuación si cambian ligeramente (¨,´,¿,¡)"
  it("puts ¿ and ¡ on the key right of 0 (¿ unshifted, ¡ with Shift)", () => {
    expect(getKeyCodesForChar(latam, "¿")).toEqual(["Equal"]);
    expect(getKeyCodesForChar(latam, "¡")).toEqual(["Equal"]);
    const equalKey = getLayoutDefinition(latam).layout.rows.number.find((k) => k.code === "Equal");
    expect([equalKey?.key, equalKey?.shiftKey]).toEqual(["¿", "¡"]);
  });

  it("composes acute accents and diaeresis with the dead key right of L", () => {
    expect(getKeyCodesForChar(latam, "á")).toEqual(["BracketLeft", "KeyA"]);
    expect(getKeyCodesForChar(latam, "É")).toEqual(["BracketLeft", ...getKeyCodesForChar(latam, "E")]);
    expect(getKeyCodesForChar(latam, "ü")).toEqual(["BracketLeft", ...getKeyCodesForChar(latam, "u")]);
    const deadKey = getLayoutDefinition(latam).layout.rows.top.find((k) => k.code === "BracketLeft");
    expect([deadKey?.key, deadKey?.shiftKey]).toEqual(["´", "¨"]);
  });

  it("differs from Spanish Dvorak only in the six punctuation keys XKB changes", () => {
    const keysByCode = (variant: LayoutVariant) =>
      new Map(
        Object.values(getLayoutDefinition(variant).layout.rows)
          .flat()
          .map((k) => [k.code, [k.key, k.shiftKey, k.finger, k.row, k.position]]),
      );
    const es = keysByCode("es-dvorak-xkb");
    const la = keysByCode(latam);
    const changed = [...la.keys()].filter((code) => JSON.stringify(la.get(code)) !== JSON.stringify(es.get(code)));
    expect(changed.sort()).toEqual(
      ["Backquote", "Backslash", "BracketLeft", "Digit3", "Equal", "Quote"].sort(),
    );
    expect(la.get("Backquote")?.slice(0, 2)).toEqual(["|", "°"]);
    expect(la.get("Digit3")?.slice(0, 2)).toEqual(["3", "#"]);
    expect(la.get("Quote")?.slice(0, 2)).toEqual(["{", "["]);
    expect(la.get("Backslash")?.slice(0, 2)).toEqual(["}", "]"]);
  });
});

describe("every practice character is typeable", () => {
  // Everything the app asks people to type: lessons, free-practice quotes and word lists
  const practiceChars = [
    ...new Set(
      [
        ...lessons.flatMap((l) => l.exercises.map((e) => e.content)),
        ...quotesEs.map((q) => q.text),
        ...commonWordsEs,
        ...commonWordsEn,
      ].flatMap((text) => [...text]),
    ),
  ];

  it("guides ñ on US International through the ~ dead key", () => {
    // ~ is Shift+` (Backquote) on US Dvorak, and n/N sit on the physical KeyL position
    expect(getKeyCodesForChar("us-dvorak-intl", "~")).toEqual(["Backquote"]);
    expect(getKeyCodesForChar("us-dvorak-intl", "ñ")).toEqual(["Backquote", "KeyL"]);
    expect(getKeyCodesForChar("us-dvorak-intl", "Ñ")).toEqual(["Backquote", "KeyL"]);
  });

  for (const variant of LAYOUT_VARIANT_IDS) {
    it(`highlights a key for every practice character in ${variant}, except declared exceptions`, () => {
      const unsupported = getLayoutDefinition(variant).unsupportedChars;
      const missing = practiceChars.filter(
        (c) => getKeyCodesForChar(variant, c).length === 0 && !unsupported.includes(c),
      );
      expect(missing).toEqual([]);
    });
  }

  it("declares ¿ and ¡ as unsupported only on US International", () => {
    expect(getLayoutDefinition("us-dvorak-intl").unsupportedChars).toEqual(["¿", "¡"]);
    expect(getLayoutDefinition("es-dvorak-xkb").unsupportedChars).toEqual([]);
    expect(getLayoutDefinition("latam-dvorak-xkb").unsupportedChars).toEqual([]);
  });
});
