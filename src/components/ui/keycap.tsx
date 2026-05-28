import { component$ } from "@builder.io/qwik";
import type { FingerName } from "../../data/types";

export interface KeycapProps {
  label: string;
  subLabel?: string;
  isActive: boolean;
  isCorrect: boolean;
  isError: boolean;
  finger: FingerName;
  width?: number;
  height?: number;
  isPressed?: boolean;
}

const fingerColorMap: Record<FingerName, string> = {
  "left-pinky": "bg-finger-left-pinky",
  "left-ring": "bg-finger-left-ring",
  "left-middle": "bg-finger-left-middle",
  "left-index": "bg-finger-left-index",
  "right-index": "bg-finger-right-index",
  "right-middle": "bg-finger-right-middle",
  "right-ring": "bg-finger-right-ring",
  "right-pinky": "bg-finger-right-pinky",
  thumb: "bg-finger-thumb",
  none: "bg-surface-muted",
};

const fingerBorderMap: Record<FingerName, string> = {
  "left-pinky": "border-b-finger-left-pinky",
  "left-ring": "border-b-finger-left-ring",
  "left-middle": "border-b-finger-left-middle",
  "left-index": "border-b-finger-left-index",
  "right-index": "border-b-finger-right-index",
  "right-middle": "border-b-finger-right-middle",
  "right-ring": "border-b-finger-right-ring",
  "right-pinky": "border-b-finger-right-pinky",
  thumb: "border-b-finger-thumb",
  none: "border-b-surface-dark/20",
};

export const Keycap = component$<KeycapProps>((props) => {
  const {
    label,
    subLabel,
    isActive,
    isCorrect,
    isError,
    finger,
    width = 1,
    height = 1,
    isPressed = false,
  } = props;

  const widthPx = width * 48;
  const heightPx = height * 48;

  const isStructural = finger === "none";

  return (
    <div
      class={[
        "relative flex flex-col items-center justify-center",
        "border-2 border-border rounded-brutal-sm font-mono text-sm select-none",
        "transition-transform duration-75 ease-out",
        isPressed ? "translate-y-0.5 shadow-brutal-pressed" : "",
        isStructural && !isPressed ? "text-surface-dark/50" : "",

        isCorrect
          ? "bg-state-correct animate-key-press text-primary-foreground"
          : isError
            ? "bg-state-error text-primary-foreground animate-shake"
            : isActive
              ? `bg-surface-card shadow-brutal-sm scale-105 border-b-4 ${fingerBorderMap[finger]}`
              : `${isStructural ? "bg-surface-muted/50" : "bg-surface-card"} border-b-4 ${fingerBorderMap[finger]}`,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        minWidth: `${widthPx}px`,
        height: `${heightPx}px`,
      }}
    >
      {/* Sub label (shift character) */}
      {subLabel && (
        <span class="text-sm font-bold leading-none text-surface-dark opacity-90 pb-0.5">
          {subLabel}
        </span>
      )}

      {/* Main label */}
      <span
        class={[
          "leading-none font-black",
          subLabel ? "text-lg" : "text-xl",
        ].join(" ")}
      >
        {label}
      </span>

      {/* Finger color indicator dot — shown when active */}
      {isActive && !isStructural && (
        <span
          class={[
            "absolute -bottom-1.5 left-1/2 -translate-x-1/2",
            "w-2 h-2 rounded-full",
            fingerColorMap[finger],
          ].join(" ")}
        />
      )}
    </div>
  );
});
