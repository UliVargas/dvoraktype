import { component$ } from "@builder.io/qwik";

export interface ProgressBarProps {
  value: number;
  label?: string;
  colorClass?: string;
}

export const ProgressBar = component$<ProgressBarProps>((props) => {
  const { value, label, colorClass = "bg-primary" } = props;
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div>
      <div class="h-4 bg-surface-muted border-2 border-border rounded-brutal-sm overflow-hidden">
        <div
          class={[
            "h-full transition-all duration-300 ease-out",
            colorClass,
          ].join(" ")}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {label && <p class="mt-1 text-sm text-surface-dark/70">{label}</p>}
    </div>
  );
});
