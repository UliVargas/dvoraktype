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
  onRetry$: QRL<() => void>;
  onNext$: QRL<() => void>;
}

// Modal dialog (WAI-ARIA APG): focus moves into the dialog when it opens, Tab
// stays inside it, and Escape retries the exercise, which closes the dialog and
// returns focus to the typing area.
export const ResultsDialog = component$<ResultsDialogProps>(
  ({ passed, stats, nextLabel, onRetry$, onNext$ }) => {
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
          onKeyDown$={(event, dialog) => {
            const e = event as KeyboardEvent;
            if (e.key === "Escape") {
              onRetry$();
              return;
            }
            if (e.key !== "Tab") return;
            // Keep focus inside the dialog
            const focusable = [...dialog.querySelectorAll<HTMLElement>("button")];
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = dialog.ownerDocument.activeElement;
            if (e.shiftKey && active === first) last?.focus();
            else if (!e.shiftKey && active === last) first?.focus();
          }}
        >
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
        </div>
      </div>
    );
  },
);
