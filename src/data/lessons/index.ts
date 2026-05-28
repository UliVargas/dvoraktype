import type { Lesson } from "../types";
import { lessons as esLessons } from "./es";

export const lessons: readonly Lesson[] = [...esLessons];


export function getLessonById(lessonId: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === lessonId);
}


export function getCumulativeKeys(lessonId: string): string[] {
  const allKeys: string[] = [];

  for (const lesson of lessons) {
    allKeys.push(...lesson.keys);
    if (lesson.id === lessonId) break;
  }
  return [...new Set(allKeys)];
}
