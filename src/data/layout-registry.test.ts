import { describe, expect, it } from "vitest";
import legacyKeyCodes from "./__fixtures__/legacy-key-codes.json";
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
    expect(LAYOUT_VARIANT_IDS).toEqual(["es-dvorak-xkb", "us-dvorak-intl"]);
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
  // Snapshot of the pre-refactor highlight logic for every character in the
  // lessons, quotes and word lists: the refactor must not change it.
  for (const [variant, byChar] of Object.entries(legacyKeyCodes)) {
    it(`highlights the same keys as before for ${variant}`, () => {
      for (const [char, codes] of Object.entries(byChar)) {
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

  it("returns nothing for empty input or unknown characters", () => {
    expect(getKeyCodesForChar("es-dvorak-xkb", "")).toEqual([]);
    expect(getKeyCodesForChar("es-dvorak-xkb", "€")).toEqual([]);
  });
});
