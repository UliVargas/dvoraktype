import {
  component$,
  useId,
  useSignal,
  useVisibleTask$,
  type QRL,
} from "@builder.io/qwik";
import { LuArrowRight, LuRefreshCw, LuTrophy } from "@qwikest/icons/lucide";
import type { TypingStats } from "../../data/types";
import { Button } from "./button";
import { Card } from "./card";
import { StatsBar } from "./stats-bar";

interface ResultsDialogProps {
  passed: boolean;
  stats: TypingStats;
  nextLabel: string;
  /** Set when saving the result failed, so the user knows it wasn't kept */
  saveError?: string;
  onRetry$: QRL<() => void>;
  onNext$: QRL<() => void>;
}

// Modal dialog (WAI-ARIA APG): focus moves into the dialog when it opens, Tab
// stays inside it, and Escape retries the exercise, which closes the dialog and
// returns focus to the typing area. Async Qwik handlers can't cancel the
// browser's Tab, so focusable sentinels at both ends send focus back around.
export const ResultsDialog = component$<ResultsDialogProps>(
  ({ passed, stats, nextLabel, saveError, onRetry$, onNext$ }) => {
    const id = useId();
    const titleId = `${id}-title`;
    const dialogRef = useSignal<HTMLDivElement>();

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(() => {
      // The primary action: "next" when passed, otherwise "retry"
      const buttons = dialogRef.value?.querySelectorAll<HTMLElement>("button");
      buttons?.[buttons.length - 1]?.focus();
    });

    return (
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dark/40 backdrop-blur-sm animate-fade-in">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          class="max-w-md w-full"
          onKeyDown$={(event) => {
            if ((event as KeyboardEvent).key === "Escape") onRetry$();
          }}
        >
          <div
            tabIndex={0}
            data-focus-sentinel="start"
            onFocus$={() => {
              const buttons = dialogRef.value?.querySelectorAll<HTMLElement>("button");
              buttons?.[buttons.length - 1]?.focus();
            }}
          />
          <Card class={`bg-surface ${!passed ? "animate-shake" : ""}`}>
            <div class="text-center mb-6">
              <div
                class={`inline-flex items-center justify-center w-16 h-16 rounded-full border-4 brutal-border mb-4 ${passed ? "bg-state-success text-white" : "bg-state-warning"}`}
                aria-hidden="true"
              >
                {passed ? (
                  <LuTrophy class="w-8 h-8" />
                ) : (
                  <LuRefreshCw class="w-8 h-8" />
                )}
              </div>
              <h3 id={titleId} class="text-3xl font-black mb-2">
                {passed ? "¡Excelente!" : "Casi lo logras"}
              </h3>
              <p class="font-medium text-surface-dark/70">
                {passed
                  ? "Has superado los requisitos de este ejercicio."
                  : "Sigue practicando para alcanzar la velocidad y precisión requerida."}
              </p>
            </div>

            {saveError && (
              <p
                role="alert"
                class="mb-4 border-2 border-border rounded-brutal-sm bg-state-warning p-3 font-bold text-surface-dark"
              >
                {saveError}
              </p>
            )}

            <StatsBar
              wpm={stats.wpm}
              accuracy={stats.accuracy}
              errors={stats.errorChars}
              elapsed={stats.elapsedTime}
            />

            <div class="mt-8 flex flex-col sm:flex-row gap-4">
              <Button
                variant={passed ? "secondary" : "primary"}
                size="lg"
                onClick$={onRetry$}
                class="flex-1 flex justify-center items-center gap-2"
              >
                <LuRefreshCw class="w-5 h-5" aria-hidden="true" /> Reintentar
              </Button>
              {passed && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick$={onNext$}
                  class="flex-1 flex justify-center items-center gap-2 text-lg border-4"
                >
                  <span class="font-black">{nextLabel}</span>
                  <LuArrowRight class="w-6 h-6 stroke-3" aria-hidden="true" />
                </Button>
              )}
            </div>
          </Card>
          <div
            tabIndex={0}
            data-focus-sentinel="end"
            onFocus$={() => {
              dialogRef.value?.querySelector<HTMLElement>("button")?.focus();
            }}
          />
        </div>
      </div>
    );
  },
);
