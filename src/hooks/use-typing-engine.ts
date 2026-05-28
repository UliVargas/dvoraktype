import {
  useStore,
  $,
  useTask$,
  useSignal,
  type PropFunction,
  type Signal,
} from "@builder.io/qwik";
import { type CharState, type TypingStats } from "../data/types";

export interface UseTypingEngineProps {
  targetText: string;
  onComplete$: PropFunction<(stats: TypingStats) => void>;
  resetKey?: string;
  currentIndexSignal?: Signal<number>;
  realTimeStatsSignal?: Signal<TypingStats | null>;
}

export const useTypingEngine = (props: UseTypingEngineProps) => {
  const state = useStore({
    currentIndex: 0,
    startTime: 0,
    isFinished: false,
    correctChars: 0,
    errorChars: 0,
    totalKeystrokes: 0,
    charStates: Array<CharState>(props.targetText.length).fill("pending"),
    currentResetKey: props.resetKey,
  });

  const hiddenInputRef = useSignal<HTMLInputElement>();
  const deadKeyPending = useSignal(false);
  const isComposing = useSignal(false);

  useTask$(({ track }) => {
    const newResetKey = track(() => props.resetKey);
    const newTargetText = track(() => props.targetText);

    if (newResetKey !== state.currentResetKey) {
      state.currentIndex = 0;
      if (props.currentIndexSignal) props.currentIndexSignal.value = 0;
      state.startTime = 0;
      state.isFinished = false;
      state.correctChars = 0;
      state.errorChars = 0;
      state.totalKeystrokes = 0;
      state.charStates = Array<CharState>(newTargetText.length).fill("pending");
      state.currentResetKey = newResetKey;
      deadKeyPending.value = false;
      isComposing.value = false;
    }
  });

  const processChar = $((typedChar: string) => {
    if (state.isFinished) return;

    if (state.currentIndex === 0 && state.startTime === 0) {
      state.startTime = Date.now();
    }

    state.totalKeystrokes++;
    const expectedChar = props.targetText[state.currentIndex];
    const newCharStates = [...state.charStates];

    if (typedChar === expectedChar) {
      newCharStates[state.currentIndex] = "correct";
      state.correctChars++;
      state.currentIndex++;
      if (props.currentIndexSignal)
        props.currentIndexSignal.value = state.currentIndex;
    } else {
      newCharStates[state.currentIndex] = "error";
      state.errorChars++;
    }
    state.charStates = newCharStates;

    const elapsedTime = Date.now() - state.startTime;
    const elapsedMinutes = elapsedTime / 60000;
    const wpm =
      elapsedMinutes > 0
        ? Math.max(0, Math.round(state.correctChars / 5 / elapsedMinutes))
        : 0;
    const accuracy =
      state.totalKeystrokes > 0
        ? Math.round((state.correctChars / state.totalKeystrokes) * 100)
        : 100;

    const currentStats: TypingStats = {
      wpm,
      accuracy,
      correctChars: state.correctChars,
      errorChars: state.errorChars,
      totalChars: props.targetText.length,
      totalKeystrokes: state.totalKeystrokes,
      elapsedTime,
    };

    if (props.realTimeStatsSignal) {
      props.realTimeStatsSignal.value = currentStats;
    }

    if (state.currentIndex >= props.targetText.length) {
      state.isFinished = true;
      props.onComplete$(currentStats);
    }
  });

  const handleKeyDown$ = $((e: KeyboardEvent) => {
    if (e.key === "Tab") {
      // eslint-disable-next-line qwik/no-async-prevent-default
      e.preventDefault();
      return;
    }
    if (e.key === "Dead") {
      deadKeyPending.value = true;
    } else if (deadKeyPending.value) {
      deadKeyPending.value = false;
    }
  });

  const handleCompositionStart$ = $(() => {
    isComposing.value = true;
  });

  const handleCompositionEnd$ = $((e: Event) => {
    isComposing.value = false;
    deadKeyPending.value = false;
    const data = (e as CompositionEvent).data;
    if (data) {
      for (const char of data) {
        processChar(char);
      }
    }
    const input = hiddenInputRef.value;
    if (input) input.value = "";
  });

  const handleInput$ = $(() => {
    const input = hiddenInputRef.value;
    if (!input) return;
    const value = input.value;

    if (isComposing.value) {
      return;
    }

    if (deadKeyPending.value) {
      input.value = "";
      return;
    }
    if (value.length > 0) {
      for (const char of value) {
        processChar(char);
      }
      input.value = "";
    }
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
