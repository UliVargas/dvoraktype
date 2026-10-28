import {
  useStore,
  $,
  useTask$,
  useSignal,
  type PropFunction,
  type Signal,
} from "@builder.io/qwik";
import { type TypingStats } from "../data/types";
import {
  computeStats,
  createTypingSession,
  typeText,
} from "./typing-session";

export interface UseTypingEngineProps {
  targetText: string;
  onComplete$: PropFunction<(stats: TypingStats) => void>;
  resetKey?: string;
  currentIndexSignal?: Signal<number>;
  realTimeStatsSignal?: Signal<TypingStats | null>;
}

export const useTypingEngine = (props: UseTypingEngineProps) => {
  const state = useStore({
    ...createTypingSession(props.targetText),
    currentResetKey: props.resetKey,
    currentTargetText: props.targetText,
  });

  const hiddenInputRef = useSignal<HTMLInputElement>();
  const isComposing = useSignal(false);

  useTask$(({ track }) => {
    const newResetKey = track(() => props.resetKey);
    const newTargetText = track(() => props.targetText);

    // A new text restarts the session even when the caller keeps the same key
    if (
      newResetKey !== state.currentResetKey ||
      newTargetText !== state.currentTargetText
    ) {
      Object.assign(state, createTypingSession(newTargetText));
      state.currentResetKey = newResetKey;
      state.currentTargetText = newTargetText;
      if (props.currentIndexSignal) props.currentIndexSignal.value = 0;
      isComposing.value = false;
    }
  });

  // Takes whatever the hidden input holds and types it. The input is the single
  // source of truth and is emptied right away, so a late duplicate event finds
  // nothing to process.
  const consumeInput$ = $(() => {
    const input = hiddenInputRef.value;
    if (!input || !input.value) return;
    const text = input.value;
    input.value = "";
    // Keystrokes after completion must not move the stats already reported
    if (state.isFinished) return;

    const now = Date.now();
    typeText(state, text, now);
    const stats = computeStats(state, now);

    if (props.currentIndexSignal) {
      props.currentIndexSignal.value = state.currentIndex;
    }
    if (props.realTimeStatsSignal) {
      props.realTimeStatsSignal.value = stats;
    }
    if (state.isFinished) {
      props.onComplete$(stats);
    }
  });

  const handleKeyDown$ = $((e: KeyboardEvent) => {
    if (e.key === "Tab") {
      // eslint-disable-next-line qwik/no-async-prevent-default
      e.preventDefault();
    }
  });

  const handleCompositionStart$ = $(() => {
    isComposing.value = true;
  });

  const handleCompositionEnd$ = $(async (e: Event) => {
    isComposing.value = false;
    const input = hiddenInputRef.value;
    const data = (e as CompositionEvent).data;
    // Prefer the composed result when the input doesn't hold it yet
    if (input && data && !input.value) input.value = data;
    await consumeInput$();
  });

  // Dead keys and IMEs are handled through composition: text typed while a
  // composition is in progress is provisional and arrives on compositionend.
  // Anything else, including a composed character delivered as plain input,
  // is typed right away.
  const handleInput$ = $(async (e: Event) => {
    if ((e as InputEvent).isComposing || isComposing.value) return;
    await consumeInput$();
  });

  return {
    state,
    hiddenInputRef,
    handleKeyDown$,
    handleCompositionStart$,
    handleCompositionEnd$,
    handleInput$,
  };
};
