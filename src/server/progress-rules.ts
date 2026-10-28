import { z } from "zod";
import { lessons } from "../data/lessons";
import { MAX_ACCURACY, MAX_WPM } from "../data/limits";

// ===================================================================
// Server-side rules for lesson progress.
// The client only reports what was typed; whether that passes, and
// whether a lesson may be practiced at all, is decided here.
// ===================================================================

const MAX_ELAPSED_MS = 60 * 60 * 1000;

const wpm = z.coerce.number().int().min(0).max(MAX_WPM);
const accuracy = z.coerce.number().int().min(0).max(MAX_ACCURACY);

export const exerciseResultSchema = z.object({
  lessonId: z.string().min(1),
  exerciseId: z.string().min(1),
  wpm,
  accuracy,
});

export const freePracticeResultSchema = z.object({
  wpm,
  accuracy,
  elapsedTime: z.coerce.number().int().min(0).max(MAX_ELAPSED_MS),
});

export interface ExerciseEvaluation {
  passed: boolean;
  isLastExercise: boolean;
}

/** Returns null when the exercise does not belong to the lesson. */
export function evaluateExercise(
  lessonId: string,
  exerciseId: string,
  stats: { wpm: number; accuracy: number },
): ExerciseEvaluation | null {
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) return null;

  const index = lesson.exercises.findIndex((e) => e.id === exerciseId);
  if (index === -1) return null;

  return {
    passed:
      stats.wpm >= lesson.requiredWpm &&
      stats.accuracy >= lesson.requiredAccuracy,
    isLastExercise: index === lesson.exercises.length - 1,
  };
}

export function exerciseBelongsToLesson(
  lessonId: string,
  exerciseId: string,
): boolean {
  const lesson = lessons.find((l) => l.id === lessonId);
  return !!lesson?.exercises.some((e) => e.id === exerciseId);
}

/** The first lesson is always open; every other one needs the previous lesson completed. */
export function isLessonUnlocked(
  lessonId: string,
  completedLessonIds: ReadonlySet<string>,
): boolean {
  const index = lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return false;
  if (index === 0) return true;
  return completedLessonIds.has(lessons[index - 1].id);
}
