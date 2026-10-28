import { component$, useSignal, $ } from "@builder.io/qwik";
import { createDOM } from "@builder.io/qwik/testing";
import { describe, expect, it } from "vitest";
import type { TypingStats } from "../../data/types";
import { TypingArea } from "./typing-area";

// Renders TypingArea and exposes its progress in the DOM for assertions
const Harness = component$<{ text: string }>(({ text }) => {
  const index = useSignal(0);
  const completions = useSignal(0);
  const lastStats = useSignal<TypingStats | null>(null);
  return (
    <div>
      <TypingArea
        targetText={text}
        currentIndexSignal={index}
        onComplete$={$((stats: TypingStats) => {
          completions.value++;
          lastStats.value = stats;
        })}
      />
      <output id="index">{index.value}</output>
      <output id="completions">{completions.value}</output>
      <output id="correct">{lastStats.value?.correctChars ?? ""}</output>
    </div>
  );
});

async function setup(text: string) {
  const { screen, render, userEvent } = await createDOM();
  await render(<Harness text={text} />);
  const input = screen.querySelector("input") as HTMLInputElement;
  const read = (id: string) => screen.querySelector(`#${id}`)?.textContent;
  // Simulates what the browser does: the value lands in the input, then the event fires
  const type = async (value: string, payload: Record<string, unknown> = {}) => {
    input.value = value;
    await userEvent(input, "input", payload);
  };
  return { input, read, type, userEvent };
}

describe("TypingArea input handling", () => {
  it("accepts a composed character delivered as plain input after a Dead keydown", async () => {
    // Linux/XKB can deliver "á" as a normal input event right after keydown "Dead"
    const { input, read, type, userEvent } = await setup("á");
    await userEvent(input, "keydown", { key: "Dead" });
    await type("á");
    expect(read("index")).toBe("1");
    expect(read("completions")).toBe("1");
  });

  it("ignores input while composing and processes the composed text once at the end", async () => {
    const { input, read, type, userEvent } = await setup("é");
    await userEvent(input, "compositionstart");
    await type("´", { isComposing: true });
    expect(read("index")).toBe("0");

    input.value = "é";
    await userEvent(input, "compositionend", { data: "é" });
    expect(read("index")).toBe("1");

    // Some browsers fire one more input event after compositionend
    await userEvent(input, "input");
    expect(read("completions")).toBe("1");
  });

  it("processes pasted text in order and completes exactly once", async () => {
    const { read, type } = await setup("hola");
    await type("hola mundo");
    expect(read("index")).toBe("4");
    expect(read("completions")).toBe("1");
    expect(read("correct")).toBe("4");
  });

  it("matches decomposed (NFD) input", async () => {
    const { read, type } = await setup("ó");
    await type("ó");
    expect(read("completions")).toBe("1");
  });
});
