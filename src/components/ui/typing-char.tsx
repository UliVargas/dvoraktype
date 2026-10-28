import { component$ } from "@builder.io/qwik";
import type { CharState } from "../../data/types";

interface TypingCharProps {
  char: string;
  state: CharState;
  isCurrent: boolean;
}

// One character of the text to type. Its props are primitives, so Qwik only
// re-renders the characters whose state or cursor changed on each keystroke
// instead of the whole text.
export const TypingChar = component$<TypingCharProps>(
  ({ char, state, isCurrent }) => {
    let stateClass = "text-surface-dark/40";
    if (state === "correct") stateClass = "text-state-success font-semibold";
    // Errors are also underlined so they don't rely on color alone
    if (state === "error")
      stateClass =
        "text-white bg-state-error underline decoration-wavy decoration-2";

    return (
      <span
        data-char-state={state}
        class={[
          "relative transition-colors duration-100",
          stateClass,
          char === " " ? "inline-block min-w-[1ch]" : "",
          char === " " && state === "error" ? "bg-state-error text-white" : "",
        ]}
      >
        {char === " " && state === "pending" ? (
          <span class="opacity-20">·</span>
        ) : (
          char
        )}
        {isCurrent && (
          <span class="absolute left-0 bottom-0 w-full h-1 bg-primary animate-cursor-blink" />
        )}
      </span>
    );
  },
);
