import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { lessons } from "../data/lessons";

// Integration tests: they need a disposable Postgres, e.g.
//   docker run --rm -d -p 127.0.0.1:55432:5432 -e POSTGRES_PASSWORD=pw postgres:16-alpine
//   TEST_DATABASE_URL=postgres://postgres:pw@127.0.0.1:55432/postgres pnpm test
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

// Locally the suite is skipped without a database; in CI that would hide it
it.runIf(!!process.env.CI && !testDatabaseUrl)("requires TEST_DATABASE_URL in CI", () => {
  throw new Error("TEST_DATABASE_URL must be set in CI so the database tests run");
});

describe.skipIf(!testDatabaseUrl)("progressService (Postgres)", () => {
  let service: typeof import("./progress.service").progressService;
  let close: () => Promise<void>;

  beforeAll(async () => {
    process.env.DATABASE_URL = testDatabaseUrl;
    const { runMigrations } = await import("../db/migrate");
    await runMigrations(testDatabaseUrl!, join(__dirname, "..", "..", "drizzle"));
    service = (await import("./progress.service")).progressService;
    close = (await import("../db")).closeDb;
  });

  afterAll(async () => {
    await close?.();
  });

  const lesson = lessons[1];
  const failing = { wpm: 0, accuracy: 0 };
  const passing = { wpm: lesson.requiredWpm, accuracy: lesson.requiredAccuracy };
  const newSession = () => crypto.randomUUID();

  it("does not complete a lesson when the last exercise is submitted with failing stats", async () => {
    const id = newSession();
    const last = lesson.exercises[lesson.exercises.length - 1];

    await service.saveExerciseResult(id, lesson.id, last.id, failing);

    const progress = await service.getAllLessonProgress(id);
    expect(progress[lesson.id].completed).toBe(false);
    expect(progress[lesson.id].attempts).toBe(1);
  });

  it("completes a lesson when every exercise is passed in order", async () => {
    const id = newSession();
    for (const exercise of lesson.exercises) {
      await service.saveExerciseResult(id, lesson.id, exercise.id, passing);
    }

    const progress = await service.getAllLessonProgress(id);
    expect(progress[lesson.id].completed).toBe(true);
    expect(progress[lesson.id].attempts).toBe(lesson.exercises.length);
  });

  it("does not complete a lesson when only the last exercise is passed", async () => {
    const id = newSession();
    const last = lesson.exercises[lesson.exercises.length - 1];

    await service.saveExerciseResult(id, lesson.id, last.id, passing);

    const progress = await service.getAllLessonProgress(id);
    expect(progress[lesson.id].completed).toBe(false);
  });

  it("keeps an exercise passed when it is retried with failing stats", async () => {
    const id = newSession();
    const [firstExercise] = lesson.exercises;

    await service.saveExerciseResult(id, lesson.id, firstExercise.id, passing);
    await service.saveExerciseResult(id, lesson.id, firstExercise.id, failing);

    const state = await service.getLessonState(id, lesson.id);
    expect(state.completedExercises).toContain(firstExercise.id);
    expect(state.nextExerciseIndex).toBe(1);
  });

  it("keeps the lesson completed when an exercise is retried after completion", async () => {
    const id = newSession();
    for (const exercise of lesson.exercises) {
      await service.saveExerciseResult(id, lesson.id, exercise.id, passing);
    }
    await service.saveExerciseResult(id, lesson.id, lesson.exercises[0].id, failing);

    const progress = await service.getAllLessonProgress(id);
    expect(progress[lesson.id].completed).toBe(true);
  });

  it("counts every attempt and keeps the best scores under concurrent saves", async () => {
    const id = newSession();
    await service.ensureUser(id);
    const scores = Array.from({ length: 10 }, (_, i) => ({ wpm: 10 + i, accuracy: 90 - i }));

    await Promise.all(
      scores.map((stats) =>
        service.saveExerciseResult(id, lesson.id, lesson.exercises[0].id, stats),
      ),
    );

    const progress = await service.getAllLessonProgress(id);
    expect(progress[lesson.id].attempts).toBe(10);
    expect(progress[lesson.id].bestWpm).toBe(19);
    expect(progress[lesson.id].bestAccuracy).toBe(90);
  });

  it("creates a user once even when loaders run concurrently", async () => {
    const id = newSession();
    await expect(
      Promise.all([service.getUserSettings(id), service.getAllLessonProgress(id)]),
    ).resolves.toBeDefined();
  });

  it("rejects an unknown lesson or exercise without writing progress", async () => {
    const id = newSession();
    await expect(
      service.saveExerciseResult(id, "nope", "L1-E1", passing),
    ).rejects.toThrow();
    await expect(
      service.saveExerciseResult(id, lesson.id, lessons[0].exercises[0].id, passing),
    ).rejects.toThrow();

    expect(await service.getAllLessonProgress(id)).toEqual({});
  });

  it("reports an explicit lesson state: next exercise, or complete", async () => {
    const id = newSession();
    expect(await service.getLessonState(id, lesson.id)).toEqual({
      nextExerciseIndex: 0,
      completedExercises: [],
      isComplete: false,
    });

    await service.saveExerciseResult(id, lesson.id, lesson.exercises[0].id, passing);
    const partial = await service.getLessonState(id, lesson.id);
    expect(partial.nextExerciseIndex).toBe(1);
    expect(partial.isComplete).toBe(false);

    for (const exercise of lesson.exercises.slice(1)) {
      await service.saveExerciseResult(id, lesson.id, exercise.id, passing);
    }
    const done = await service.getLessonState(id, lesson.id);
    expect(done.isComplete).toBe(true);
    // A completed lesson reopens on its last exercise, as before
    expect(done.nextExerciseIndex).toBe(lesson.exercises.length - 1);
    expect([...done.completedExercises].sort()).toEqual(lesson.exercises.map((e) => e.id).sort());
  });

  it("reports whether a lesson is unlocked for the session", async () => {
    const id = newSession();
    expect(await service.isLessonUnlocked(id, lessons[0].id)).toBe(true);
    expect(await service.isLessonUnlocked(id, lesson.id)).toBe(false);

    for (const exercise of lessons[0].exercises) {
      await service.saveExerciseResult(id, lessons[0].id, exercise.id, {
        wpm: lessons[0].requiredWpm,
        accuracy: lessons[0].requiredAccuracy,
      });
    }
    expect(await service.isLessonUnlocked(id, lesson.id)).toBe(true);
  });
});
