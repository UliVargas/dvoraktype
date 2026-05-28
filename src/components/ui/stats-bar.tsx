import { component$ } from "@builder.io/qwik";
import { LuZap, LuTarget, LuX, LuClock } from "@qwikest/icons/lucide";

export interface StatsBarProps {
  wpm: number;
  accuracy: number;
  errors: number;
  elapsed: number;
}

/**
 * Format milliseconds to mm:ss.
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export const StatsBar = component$<StatsBarProps>((props) => {
  const { wpm, accuracy, errors, elapsed } = props;

  return (
    <div class="brutal-card p-4 sm:p-6 bg-surface-card grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center sm:text-left">
      {/* WPM */}
      <div class="flex flex-col sm:flex-row items-center sm:items-start gap-2">
        <LuZap class="w-5 h-5 text-primary mt-1 hidden sm:block" />
        <div class="flex flex-col items-center sm:items-start">
          <span class="text-xs text-surface-dark/60 uppercase tracking-wide">
            WPM
          </span>
          <span class="font-mono text-xl sm:text-lg font-bold text-primary">
            {wpm}
          </span>
        </div>
      </div>

      {/* Accuracy */}
      <div class="flex flex-col sm:flex-row items-center sm:items-start gap-2">
        <LuTarget class="w-5 h-5 text-state-success mt-1 hidden sm:block" />
        <div class="flex flex-col items-center sm:items-start">
          <span class="text-xs text-surface-dark/60 uppercase tracking-wide">
            Precisión
          </span>
          <span class="font-mono text-xl sm:text-lg font-bold">
            {accuracy}%
          </span>
        </div>
      </div>

      {/* Errors */}
      <div class="flex flex-col sm:flex-row items-center sm:items-start gap-2">
        <LuX class="w-5 h-5 text-state-error mt-1 hidden sm:block" />
        <div class="flex flex-col items-center sm:items-start">
          <span class="text-xs text-surface-dark/60 uppercase tracking-wide">
            Errores
          </span>
          <span class="font-mono text-xl sm:text-lg font-bold">{errors}</span>
        </div>
      </div>

      {/* Time */}
      <div class="flex flex-col sm:flex-row items-center sm:items-start gap-2">
        <LuClock class="w-5 h-5 text-primary-dark mt-1 hidden sm:block" />
        <div class="flex flex-col items-center sm:items-start">
          <span class="text-xs text-surface-dark/60 uppercase tracking-wide">
            Tiempo
          </span>
          <span class="font-mono text-xl sm:text-lg font-bold">
            {formatTime(elapsed)}
          </span>
        </div>
      </div>
    </div>
  );
});
