import { component$, type QRL } from "@builder.io/qwik";
import { LuLock, LuZap, LuTarget } from "@qwikest/icons/lucide";
import type { Lesson } from "../../data/types";

export type LessonStatus = "locked" | "available" | "in-progress" | "completed";

export interface LessonCardProps {
  lesson: Lesson;
  status: LessonStatus;
  bestWpm?: number;
  bestAccuracy?: number;
  onClick$: QRL<() => void>;
}

export const LessonCard = component$<LessonCardProps>((props) => {
  const { lesson, status, bestWpm, bestAccuracy } = props;

  const isLocked = status === "locked";
  const isCompleted = status === "completed";
  const isInProgress = status === "in-progress";

  const baseClasses =
    "flex flex-col h-full rounded-brutal-sm p-4 sm:p-5 transition-all text-left relative group";

  const statusClasses = {
    locked:
      "border-2 border-border bg-surface-muted opacity-60 grayscale cursor-not-allowed",
    available:
      "border-2 border-border bg-surface-card shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-brutal-sm active:translate-x-1 active:translate-y-1 active:shadow-brutal-pressed cursor-pointer",
    "in-progress":
      "border-2 border-[#eab308] bg-[#fefce8] shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-brutal-sm active:translate-x-1 active:translate-y-1 active:shadow-brutal-pressed cursor-pointer",
    completed:
      "border-2 border-state-success bg-state-correct/20 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-brutal-sm active:translate-x-1 active:translate-y-1 active:shadow-brutal-pressed cursor-pointer",
  };

  return (
    <button
      class={[baseClasses, statusClasses[status as keyof typeof statusClasses]]
        .filter(Boolean)
        .join(" ")}
      disabled={isLocked}
      onClick$={props.onClick$}
    >
      {/* Status badge */}
      {isLocked && (
        <div class="absolute top-3 right-3 text-surface-dark/40">
          <LuLock class="w-5 h-5" />
        </div>
      )}
      {isInProgress && (
        <div class="absolute -top-2 -right-2 bg-[#eab308] text-white border-2 border-border text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-brutal-sm shadow-brutal rotate-3 z-10">
          En Progreso
        </div>
      )}
      {isCompleted && (
        <div class="absolute -top-2 -right-2 bg-state-success text-white border-2 border-border text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-brutal-sm shadow-brutal rotate-3 z-10">
          Completado
        </div>
      )}

      {/* Lesson number + title */}
      <div class="flex items-baseline gap-3 mb-1">
        <span class="font-mono text-2xl font-bold text-primary">
          {lesson.id.replace("leccion-", "")}
        </span>
        <h3 class="text-lg font-bold">{lesson.title}</h3>
      </div>

      {/* Description */}
      <p class="text-sm text-surface-dark/70 mb-3">{lesson.description}</p>

      {/* Key badges */}
      <div class="flex flex-wrap gap-1.5 mb-3">
        {lesson.keys.map((key) => (
          <span
            key={key}
            class="inline-flex items-center justify-center min-w-7 h-7 px-2 font-mono text-sm font-bold border-2 border-border rounded-brutal-sm bg-surface-card shadow-brutal-sm"
          >
            {key}
          </span>
        ))}
      </div>

      {/* Completed stats */}
      {isCompleted && bestWpm != null && bestAccuracy != null && (
        <div class="flex items-center gap-4 pt-2 border-t border-border/40 text-sm">
          <div class="flex items-center gap-1 text-surface-dark/70">
            <LuZap class="w-4 h-4 text-primary" />
            <span class="font-mono font-bold">{bestWpm}</span>
            <span>wpm</span>
          </div>
          <div class="flex items-center gap-1 text-surface-dark/70">
            <LuTarget class="w-4 h-4 text-state-success" />
            <span class="font-mono font-bold">{bestAccuracy}%</span>
            <span>precisión</span>
          </div>
        </div>
      )}
    </button>
  );
});
