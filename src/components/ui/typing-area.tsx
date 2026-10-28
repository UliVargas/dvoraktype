import {
  component$,
  useVisibleTask$,
  type PropFunction,
  type Signal,
} from "@builder.io/qwik";
import { type TypingStats } from "../../data/types";
import { useTypingEngine } from "../../hooks/use-typing-engine";

interface TypingAreaProps {
  targetText: string;
  onComplete$: PropFunction<(stats: TypingStats) => void>;
  resetKey?: string;
  currentIndexSignal?: Signal<number>;
  realTimeStatsSignal?: Signal<TypingStats | null>;
}

export const TypingArea = component$<TypingAreaProps>((props) => {
  const engine = useTypingEngine(props);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    track(() => engine.state.currentResetKey);
    const input = engine.hiddenInputRef.value;
    if (input) {
      input.value = "";
      input.focus();
    }
  });

  // Screen reader announcements: the current error, or completion
  const { state } = engine;
  const announcement = state.isFinished
    ? "Ejercicio completado."
    : state.charStates[state.currentIndex] === "error"
      ? `Error en el carácter ${state.currentIndex + 1} de ${state.targetChars.length}: se esperaba «${state.targetChars[state.currentIndex]}».`
      : "";

  return (
    <div
      class="brutal-card p-6 md:p-8 text-2xl md:text-3xl font-mono leading-relaxed tracking-wide focus:outline-none focus-within:ring-4 focus-within:ring-primary/50 relative cursor-text"
      onClick$={() => {
        engine.hiddenInputRef.value?.focus();
      }}
    >
      <input
        ref={engine.hiddenInputRef}
        type="text"
        class="absolute opacity-0 w-0 h-0 pointer-events-none"
        tabIndex={0}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        spellcheck={false}
        aria-label="Área de escritura"
        onKeyDown$={engine.handleKeyDown$}
        onCompositionStart$={engine.handleCompositionStart$}
        onCompositionEnd$={engine.handleCompositionEnd$}
        onInput$={engine.handleInput$}
      />

      <p role="status" aria-live="polite" class="sr-only">
        {announcement}
      </p>

      <div class="wrap-break-word select-none" aria-hidden="true">
        {engine.state.targetChars.map((char, index) => {
          const charState = engine.state.charStates[index];
          const isCurrent = index === engine.state.currentIndex;

          let stateClass = "text-surface-dark/40";
          if (charState === "correct")
            stateClass = "text-state-success font-semibold";
          // Errors are also underlined so they don't rely on color alone
          if (charState === "error")
            stateClass = "text-white bg-state-error underline decoration-wavy decoration-2";

          return (
            <span
              key={`${index}-${char}`}
              data-char-state={charState}
              class={[
                "relative transition-colors duration-100",
                stateClass,
                char === " " ? "inline-block min-w-[1ch]" : "",
                char === " " && charState === "error"
                  ? "bg-state-error text-white"
                  : "",
              ]}
            >
              {char === " " && charState === "pending" ? (
                <span class="opacity-20">·</span>
              ) : (
                char
              )}
              {isCurrent && !engine.state.isFinished && (
                <span class="absolute left-0 bottom-0 w-full h-1 bg-primary animate-cursor-blink" />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
});
