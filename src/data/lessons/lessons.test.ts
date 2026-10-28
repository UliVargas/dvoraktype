import { describe, expect, it } from "vitest";
import { lessons, lessonForLayout, taughtKeys } from ".";
import {
  LAYOUT_VARIANT_IDS,
  getKeyCodesForChar,
  getLayoutDefinition,
} from "../layout-registry";
import type { LayoutVariant } from "../types";

function isTypeable(variant: LayoutVariant, char: string): boolean {
  return (
    getKeyCodesForChar(variant, char).length > 0 ||
    getLayoutDefinition(variant).unsupportedChars.includes(char)
  );
}

// Before the Shift lesson, exercises may only use the keys taught so far
// (or characters composed from them with a dead key); from it on, anything
// the layout can type is fair game.
function untaughtChars(variant: LayoutVariant, lessonId: string, text: string) {
  const taught = taughtKeys(lessonId, variant);
  if (taught.includes("Shift")) {
    return [...new Set([...text])].filter((c) => c !== " " && !isTypeable(variant, c));
  }
  const compositions = getLayoutDefinition(variant).deadKeyCompositions;
  const ok = (c: string): boolean =>
    c === " " ||
    taught.includes(c) ||
    (compositions[c]?.every((k) => taught.includes(k)) ?? false);
  return [...new Set([...text])].filter((c) => !ok(c));
}

describe("lessons per layout", () => {
  for (const variant of LAYOUT_VARIANT_IDS) {
    it(`only uses keys taught so far in ${variant}`, () => {
      const problems = lessons.flatMap((base) => {
        const lesson = lessonForLayout(base, variant);
        return lesson.exercises
          .map((e) => ({ exercise: e.id, chars: untaughtChars(variant, lesson.id, e.content) }))
          .filter((p) => p.chars.length > 0);
      });
      expect(problems).toEqual([]);
    });

    it(`teaches keys that exist in ${variant}`, () => {
      const missing = lessons.flatMap((base) =>
        lessonForLayout(base, variant)
          .keys.filter((k) => k !== "Shift" && !isTypeable(variant, k))
          .map((k) => `${base.id}: ${k}`),
      );
      expect(missing).toEqual([]);
    });
  }

  it("describes the home row of each layout in the introduction", () => {
    const intro = (variant: LayoutVariant) =>
      lessonForLayout(lessons[0], variant).description;
    expect(intro("es-dvorak-xkb")).toContain("(D R T N S)");
    expect(intro("latam-dvorak-xkb")).toContain("(D R T N S)");
    expect(intro("us-dvorak-intl")).toContain("(D H T N S)");
  });

  it("names the dead key each layout uses for accents", () => {
    const accents = lessons.find((l) => l.id === "leccion-09")!;
    expect(lessonForLayout(accents, "es-dvorak-xkb").description).toContain("tecla muerta ´");
    expect(lessonForLayout(accents, "us-dvorak-intl").description).toContain("tecla muerta '");
  });

  it("keeps exercise ids and order on every layout, so saved progress still matches", () => {
    for (const variant of LAYOUT_VARIANT_IDS) {
      for (const base of lessons) {
        expect(lessonForLayout(base, variant).exercises.map((e) => e.id)).toEqual(
          base.exercises.map((e) => e.id),
        );
      }
    }
  });

  it("only overrides exercises that exist, so a mistyped id can't be silently ignored", () => {
    const unknown = lessons.flatMap((lesson) =>
      Object.values(lesson.layoutOverrides ?? {}).flatMap((override) =>
        Object.keys(override?.exercises ?? {}).filter(
          (id) => !lesson.exercises.some((e) => e.id === id),
        ),
      ),
    );
    expect(unknown).toEqual([]);
  });

  it("leaves the Spanish layout's lessons unchanged", () => {
    for (const base of lessons) {
      expect(lessonForLayout(base, "es-dvorak-xkb")).toEqual(base);
    }
  });
});

describe("difficulty curve", () => {
  // Production data (2026-10-28): attempts per lesson climbed from 3 to 18.7 by
  // lesson 05 and half the learners stopped there; engaged learners' median
  // free-practice speed was 19 WPM. Requirements now rise gently.
  it("starts within reach of someone new to Dvorak", () => {
    expect(lessons[0].requiredWpm).toBeLessThanOrEqual(6);
    expect(lessons[0].requiredAccuracy).toBeLessThanOrEqual(70);
  });

  it("never raises speed by more than 1 WPM or accuracy by more than 3 points per lesson", () => {
    const jumps = lessons.slice(1).flatMap((lesson, i) => {
      const previous = lessons[i];
      const wpmStep = lesson.requiredWpm - previous.requiredWpm;
      const accuracyStep = lesson.requiredAccuracy - previous.requiredAccuracy;
      return wpmStep < 0 || wpmStep > 1 || accuracyStep < 0 || accuracyStep > 3
        ? [`${lesson.id}: +${wpmStep} WPM, +${accuracyStep}%`]
        : [];
    });
    expect(jumps).toEqual([]);
  });

  it("ends below the speed engaged learners reach in free practice", () => {
    const last = lessons[lessons.length - 1];
    expect(last.requiredWpm).toBeLessThan(19);
    expect(last.requiredAccuracy).toBeLessThanOrEqual(90);
  });
});
