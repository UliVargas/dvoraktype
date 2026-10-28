import {
  component$,
  useId,
  useVisibleTask$,
  type PropFunction,
  type Signal,
} from "@builder.io/qwik";
import { type TypingStats } from "../../data/types";
import { useTypingEngine } from "../../hooks/use-typing-engine";
import { TypingChar } from "./typing-char";

interface TypingAreaProps {
  targetText: string;
  onComplete$: PropFunction<(stats: TypingStats) => void>;
  resetKey?: string;
  currentIndexSignal?: Signal<number>;
  realTimeStatsSignal?: Signal<TypingStats | null>;
}

export const TypingArea = component$<TypingAreaProps>((props) => {
  const engine = useTypingEngine(props);
  const id = useId();
  const textId = `${id}-text`;

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
      ? // The error count makes a repeated mistake produce a new announcement
        `Error en el carácter ${state.currentIndex + 1} de ${state.targetChars.length}: se esperaba «${state.targetChars[state.currentIndex]}». Errores: ${state.errorChars}.`
      : "";

  return (
    <div
      class="brutal-card p-6 md:p-8 text-2xl md:text-3xl font-mono leading-relaxed tracking-wide focus:outline-none focus-within:outline-4 focus-within:outline-primary/60 focus-within:outline-offset-2 relative cursor-text"
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
        aria-describedby={textId}
        onKeyDown$={engine.handleKeyDown$}
        onCompositionStart$={engine.handleCompositionStart$}
        onCompositionEnd$={engine.handleCompositionEnd$}
        onInput$={engine.handleInput$}
      />

      {/* The visual characters are aria-hidden; this is what screen readers read */}
      <p id={textId} class="sr-only">
        Texto a escribir: {engine.state.targetChars.join("")}
      </p>

      <p role="status" aria-live="polite" class="sr-only">
        {announcement}
      </p>

      <div class="wrap-break-word select-none" aria-hidden="true">
        {engine.state.targetChars.map((char, index) => (
          <TypingChar
            key={`${index}-${char}`}
            char={char}
            state={engine.state.charStates[index]}
            isCurrent={
              index === engine.state.currentIndex && !engine.state.isFinished
            }
          />
        ))}
      </div>
    </div>
  );
});
