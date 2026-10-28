import { describe, expect, it } from "vitest";
import { lessons } from "../data/lessons";
import {
  evaluateExercise,
  exerciseBelongsToLesson,
  exerciseResultSchema,
  freePracticeResultSchema,
  isLessonUnlocked,
} from "./progress-rules";

const first = lessons[0];
const second = lessons[1];
const lastExercise = second.exercises[second.exercises.length - 1];

describe("evaluateExercise", () => {
  it("passes when wpm and accuracy meet the lesson requirements", () => {
    const result = evaluateExercise(second.id, second.exercises[0].id, {
      wpm: second.requiredWpm,
      accuracy: second.requiredAccuracy,
    });
    expect(result).toEqual({ passed: true, isLastExercise: false });
  });

  it("fails when wpm is below the requirement, whatever the client claims", () => {
    const result = evaluateExercise(second.id, second.exercises[0].id, {
      wpm: second.requiredWpm - 1,
      accuracy: 100,
    });
    expect(result?.passed).toBe(false);
  });

  it("fails when accuracy is below the requirement", () => {
    const result = evaluateExercise(second.id, second.exercises[0].id, {
      wpm: 300,
      accuracy: second.requiredAccuracy - 1,
    });
    expect(result?.passed).toBe(false);
  });

  it("derives isLastExercise from the lesson's exercise order", () => {
    const result = evaluateExercise(second.id, lastExercise.id, {
      wpm: 0,
      accuracy: 0,
    });
    expect(result?.isLastExercise).toBe(true);
  });

  it("returns null for an unknown lesson or an exercise of another lesson", () => {
    expect(evaluateExercise("nope", "L1-E1", { wpm: 50, accuracy: 100 })).toBeNull();
    expect(
      evaluateExercise(second.id, first.exercises[0].id, { wpm: 50, accuracy: 100 }),
    ).toBeNull();
  });
});

describe("exerciseBelongsToLesson", () => {
  it("accepts an exercise of the lesson", () => {
    expect(exerciseBelongsToLesson(second.id, second.exercises[0].id)).toBe(true);
  });

  it("rejects unknown lessons and exercises of other lessons", () => {
    expect(exerciseBelongsToLesson("nope", second.exercises[0].id)).toBe(false);
    expect(exerciseBelongsToLesson(second.id, first.exercises[0].id)).toBe(false);
  });
});

describe("isLessonUnlocked", () => {
  it("always unlocks the first lesson", () => {
    expect(isLessonUnlocked(first.id, new Set())).toBe(true);
  });

  it("locks a lesson until the previous one is completed", () => {
    expect(isLessonUnlocked(second.id, new Set())).toBe(false);
    expect(isLessonUnlocked(second.id, new Set([first.id]))).toBe(true);
  });

  it("treats unknown lessons as locked", () => {
    expect(isLessonUnlocked("nope", new Set([first.id]))).toBe(false);
  });
});

describe("exerciseResultSchema", () => {
  const valid = { lessonId: second.id, exerciseId: "L1-E1", wpm: "42", accuracy: "97" };

  it("accepts form strings and coerces them to integers", () => {
    expect(exerciseResultSchema.parse(valid)).toEqual({
      lessonId: second.id,
      exerciseId: "L1-E1",
      wpm: 42,
      accuracy: 97,
    });
  });

  it.each([
    ["NaN wpm", { wpm: "NaN" }],
    ["non-numeric wpm", { wpm: "fast" }],
    ["negative wpm", { wpm: "-1" }],
    ["wpm above 300", { wpm: "301" }],
    ["fractional wpm", { wpm: "42.5" }],
    ["accuracy above 100", { accuracy: "101" }],
    ["empty lessonId", { lessonId: "" }],
  ])("rejects %s", (_label, override) => {
    expect(exerciseResultSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });

  it("drops client-sent passed and isLastExercise fields", () => {
    const parsed = exerciseResultSchema.parse({
      ...valid,
      passed: "true",
      isLastExercise: "true",
    });
    expect(parsed).not.toHaveProperty("passed");
    expect(parsed).not.toHaveProperty("isLastExercise");
  });
});

describe("freePracticeResultSchema", () => {
  const valid = { wpm: "60", accuracy: "95", elapsedTime: "30000" };

  it("accepts bounded numbers", () => {
    expect(freePracticeResultSchema.parse(valid)).toEqual({
      wpm: 60,
      accuracy: 95,
      elapsedTime: 30000,
    });
  });

  it.each([
    ["NaN wpm", { wpm: "NaN" }],
    ["accuracy above 100", { accuracy: "101" }],
    ["negative elapsedTime", { elapsedTime: "-5" }],
    ["elapsedTime above one hour", { elapsedTime: String(60 * 60 * 1000 + 1) }],
  ])("rejects %s", (_label, override) => {
    expect(freePracticeResultSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});
