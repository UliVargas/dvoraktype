import type { LayoutVariant, Lesson } from "../types";
import { lessons as esLessons } from "./es";

export const lessons: readonly Lesson[] = [...esLessons];


export function getLessonById(lessonId: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === lessonId);
}


/** `lesson` as seen on `variant`: its texts, keys and exercise contents for that layout. */
export function lessonForLayout(lesson: Lesson, variant: LayoutVariant): Lesson {
  const override = lesson.layoutOverrides?.[variant];
  if (!override) return lesson;
  return {
    ...lesson,
    description: override.description ?? lesson.description,
    keys: override.keys ?? lesson.keys,
    exercises: lesson.exercises.map((exercise) => ({
      ...exercise,
      content: override.exercises?.[exercise.id] ?? exercise.content,
    })),
  };
}

/** Keys taught up to and including `lessonId` on `variant`. */

export function taughtKeys(lessonId: string, variant: LayoutVariant): string[] {
  const allKeys: string[] = [];
  for (const lesson of lessons) {
    allKeys.push(...lessonForLayout(lesson, variant).keys);
    if (lesson.id === lessonId) break;
  }
  return [...new Set(allKeys)];
}
