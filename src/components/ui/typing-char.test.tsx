import { createDOM } from "@builder.io/qwik/testing";
import { describe, expect, it } from "vitest";
import type { CharState } from "../../data/types";
import { TypingChar } from "./typing-char";

async function renderChar(char: string, state: CharState, isCurrent = false) {
  const { screen, render } = await createDOM();
  await render(<TypingChar char={char} state={state} isCurrent={isCurrent} />);
  const span = screen.querySelector("[data-char-state]") as HTMLElement;
  return { span, cursor: span.querySelector(".animate-cursor-blink") };
}

describe("TypingChar", () => {
  it.each([
    ["pending", ["text-surface-dark/40"]],
    ["correct", ["text-state-success", "font-semibold"]],
    ["error", ["text-white", "bg-state-error"]],
  ] as const)("marks %s characters", async (state, classes) => {
    const { span } = await renderChar("a", state);
    expect(span.getAttribute("data-char-state")).toBe(state);
    for (const cls of classes) expect(span.className).toContain(cls);
    expect(span.textContent).toBe("a");
  });

  it("underlines errors so they don't rely on color alone", async () => {
    const { span } = await renderChar("a", "error");
    expect(span.className).toContain("underline");
    expect(span.className).toContain("decoration-wavy");
  });

  it("shows a faint dot for a pending space and the space itself once typed", async () => {
    expect((await renderChar(" ", "pending")).span.textContent).toBe("·");
    expect((await renderChar(" ", "correct")).span.textContent).toBe(" ");
  });

  it("gives a mistyped space a visible error background", async () => {
    const { span } = await renderChar(" ", "error");
    expect(span.className).toContain("min-w-[1ch]");
    expect(span.className).toContain("bg-state-error");
    expect(span.className).toContain("text-white");
  });

  it("draws the cursor only on the current character", async () => {
    expect((await renderChar("a", "pending", true)).cursor).toBeTruthy();
    expect((await renderChar("a", "pending", false)).cursor).toBeFalsy();
  });
});
