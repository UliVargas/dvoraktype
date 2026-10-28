import { $, component$, useSignal } from "@builder.io/qwik";
import { createDOM } from "@builder.io/qwik/testing";
import { describe, expect, it } from "vitest";
import { canonicalUrl } from "../router-head/canonical";
import type { LayoutVariant, TypingStats } from "../../data/types";
import { LayoutSelector, nextMenuIndex } from "./layout-selector";
import { ResultsDialog } from "./results-dialog";
import { TypingArea } from "./typing-area";

describe("canonicalUrl", () => {
  it("drops the query string and hash", () => {
    expect(canonicalUrl(new URL("https://dvoraktype.com/practica/?utm_source=x#top"))).toBe(
      "https://dvoraktype.com/practica/",
    );
  });
});

const SelectorHarness = component$(() => {
  const current = useSignal<LayoutVariant>("es-dvorak-xkb");
  return (
    <div>
      <LayoutSelector current={current.value} onSelect$={$((v: LayoutVariant) => { current.value = v; })} />
      <output id="current">{current.value}</output>
    </div>
  );
});

// createDOM doesn't implement focus (activeElement stays undefined), so the
// roving focus is tested through its index calculation; the focus moves
// themselves and the dialog's Tab trap are covered by real-browser checks.
describe("nextMenuIndex", () => {
  it.each([
    ["ArrowDown", 0, 1],
    ["ArrowDown", 2, 0],
    ["ArrowUp", 0, 2],
    ["ArrowUp", 2, 1],
    ["Home", 1, 0],
    ["End", 0, 2],
    ["ArrowDown", -1, 0],
    ["ArrowUp", -1, 2],
  ] as const)("%s from %i goes to %i of 3", (key, current, expected) => {
    expect(nextMenuIndex(key, current, 3)).toBe(expected);
  });

  it("ignores other keys", () => {
    expect(nextMenuIndex("a", 1, 3)).toBeUndefined();
  });
});

describe("LayoutSelector (menu button pattern)", () => {
  async function setup() {
    const { screen, render, userEvent } = await createDOM();
    await render(<SelectorHarness />);
    const trigger = screen.querySelector("button[aria-haspopup]") as HTMLButtonElement;
    return { screen, userEvent, trigger };
  }

  it("exposes a collapsed menu button", async () => {
    const { trigger, screen } = await setup();
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.querySelector('[role="menu"]')).toBeFalsy();
  });

  it("opens a menu of radio items with the current layout checked", async () => {
    const { trigger, screen, userEvent } = await setup();
    await userEvent(trigger, "click");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const menu = screen.querySelector('[role="menu"]');
    expect(menu?.getAttribute("aria-labelledby")).toBe(trigger.id);
    const items = [...screen.querySelectorAll('[role="menuitemradio"]')];
    expect(items.map((i) => i.textContent)).toEqual(["Dvorak Español", "Dvorak US Int.", "Dvorak Latam"]);
    expect(items.map((i) => i.getAttribute("aria-checked"))).toEqual(["true", "false", "false"]);
  });

  it("keeps a mouse click from closing the menu before it lands", async () => {
    // Real focus transitions can't be simulated here; this pins the two guards
    const { trigger, screen, userEvent } = await setup();
    await userEvent(trigger, "click");
    expect(trigger.parentElement?.getAttribute("tabindex")).toBe("-1");
    const items = [...screen.querySelectorAll('[role="menuitemradio"]')];
    expect(items.every((i) => i.hasAttribute("preventdefault:mousedown"))).toBe(true);
  });

  it("stays open when focus moves inside it and closes when focus leaves", async () => {
    const { trigger, screen, userEvent } = await setup();
    await userEvent(trigger, "click");
    const container = trigger.parentElement as HTMLElement;
    const item = screen.querySelector('[role="menuitemradio"]') as HTMLElement;

    await userEvent(container, "focusout", { relatedTarget: item });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    await userEvent(container, "focusout", { relatedTarget: null });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes on Escape without changing the layout", async () => {
    const { trigger, screen, userEvent } = await setup();
    await userEvent(trigger, "click");
    await userEvent('[role="menu"]', "keydown", { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.querySelector("#current")?.textContent).toBe("es-dvorak-xkb");
  });

  it("selects a layout and closes", async () => {
    const { trigger, screen, userEvent } = await setup();
    await userEvent(trigger, "click");
    const latam = [...screen.querySelectorAll('[role="menuitemradio"]')][2];
    await userEvent(latam, "click");
    expect(screen.querySelector("#current")?.textContent).toBe("latam-dvorak-xkb");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});

const stats: TypingStats = {
  wpm: 30, accuracy: 95, correctChars: 19, errorChars: 1, totalChars: 19, totalKeystrokes: 20, elapsedTime: 8000,
};

const DialogHarness = component$<{ passed: boolean }>(({ passed }) => {
  const retries = useSignal(0);
  return (
    <div>
      <ResultsDialog
        passed={passed}
        stats={stats}
        nextLabel="Siguiente"
        onRetry$={$(() => { retries.value++; })}
        onNext$={$(() => {})}
      />
      <output id="retries">{retries.value}</output>
    </div>
  );
});

describe("ResultsDialog", () => {
  it("is a labelled modal dialog", async () => {
    const { screen, render } = await createDOM();
    await render(<DialogHarness passed={true} />);
    const dialog = screen.querySelector('[role="dialog"]');
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    const title = screen.querySelector(`[id="${dialog?.getAttribute("aria-labelledby")}"]`);
    expect(title?.textContent).toBe("¡Excelente!");
  });

  it("retries on Escape", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<DialogHarness passed={false} />);
    await userEvent('[role="dialog"]', "keydown", { key: "Escape" });
    expect(screen.querySelector("#retries")?.textContent).toBe("1");
  });

  it("only offers 'next' when the exercise was passed", async () => {
    for (const passed of [true, false]) {
      const { screen, render } = await createDOM();
      await render(<DialogHarness passed={passed} />);
      const labels = [...screen.querySelectorAll('[role="dialog"] button')].map((b) => b.textContent?.trim());
      expect(labels.some((l) => l?.includes("Siguiente"))).toBe(passed);
    }
  });
});

const TypingHarness = component$(() => (
  <TypingArea targetText="ab" onComplete$={$(() => {})} />
));

describe("TypingArea accessibility", () => {
  async function setup() {
    const { screen, render, userEvent } = await createDOM();
    await render(<TypingHarness />);
    const input = screen.querySelector("input") as HTMLInputElement;
    const type = async (value: string) => {
      input.value = value;
      await userEvent(input, "input");
    };
    const live = () => screen.querySelector('[role="status"]')?.textContent?.trim();
    return { screen, type, live };
  }

  it("marks errors with more than color", async () => {
    const { screen, type } = await setup();
    await type("x");
    const first = screen.querySelector('[data-char-state="error"]');
    expect(first).toBeTruthy();
    expect(first?.className).toContain("underline");
  });

  it("exposes the text to type to screen readers", async () => {
    const { screen } = await setup();
    const label = screen.querySelector("input")?.getAttribute("aria-describedby");
    expect(screen.querySelector(`[id="${label}"]`)?.textContent).toBe("Texto a escribir: ab");
  });

  it("announces a repeated error again by counting errors", async () => {
    const { type, live } = await setup();
    await type("x");
    const first = live();
    await type("y");
    expect(live()).not.toBe(first);
    expect(live()).toContain("Errores: 2");
  });

  it("announces errors and completion politely", async () => {
    const { screen, type, live } = await setup();
    expect(screen.querySelector('[role="status"]')?.getAttribute("aria-live")).toBe("polite");
    await type("x");
    expect(live()).toBe("Error en el carácter 1 de 2: se esperaba «a». Errores: 1.");
    await type("ab");
    expect(live()).toBe("Ejercicio completado.");
  });
});
