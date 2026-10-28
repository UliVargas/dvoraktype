import { createDOM } from "@builder.io/qwik/testing";
import { describe, expect, it } from "vitest";
import { getLayoutDefinition } from "../../data/layout-registry";
import type { LayoutVariant } from "../../data/types";
import { Keyboard } from "./keyboard";

async function renderKeyboard(variant: LayoutVariant, targetChar?: string) {
  const { screen, render } = await createDOM();
  await render(
    <Keyboard layout={getLayoutDefinition(variant).layout} targetChar={targetChar} />,
  );
  const hint = screen.querySelector('[aria-live="polite"]');
  return { hint };
}

describe("Keyboard unsupported-character hint", () => {
  it.each(["¿", "¡"])("tells US International users how to type %s", async (char) => {
    const { hint } = await renderKeyboard("us-dvorak-intl", char);
    expect(hint?.textContent).toContain(`«${char}» no tiene una tecla directa en Dvorak US Internacional`);
    expect(hint?.classList.contains("sr-only")).toBe(false);
  });

  it.each([
    ["es-dvorak-xkb", "¿"],
    ["latam-dvorak-xkb", "¿"],
    ["latam-dvorak-xkb", "¡"],
    ["us-dvorak-intl", "a"],
    ["us-dvorak-intl", undefined],
  ] as const)("stays empty and visually hidden for %s with %s", async (variant, char) => {
    const { hint } = await renderKeyboard(variant, char);
    expect(hint?.textContent?.trim()).toBe("");
    expect(hint?.classList.contains("sr-only")).toBe(true);
  });

});
