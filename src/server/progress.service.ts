import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../db';
import { users, lessonProgress, exerciseProgress, freePracticeStats, userSettings, feedbacks } from '../db/schema';
import { lessons } from '../data/lessons';
import { DEFAULT_LAYOUT } from '../data/layout-registry';
import { evaluateExercise, isLessonUnlocked } from './progress-rules';

export const progressService = {
  async submitFeedback(sessionId: string, type: string, message: string) {
    await this.ensureUser(sessionId);
    await db.insert(feedbacks).values({
      userId: sessionId,
      type,
      message,
    });
  },
  async ensureUser(sessionId: string) {
    // Atomic upsert: route loaders run in parallel, so select-then-insert races on users_pkey.
    await db.insert(users).values({ id: sessionId }).onConflictDoNothing({ target: users.id });
  },

  async getAllLessonProgress(sessionId: string) {
    await this.ensureUser(sessionId);
    const progress = await db.select().from(lessonProgress).where(eq(lessonProgress.userId, sessionId));
    const progressMap: Record<string, any> = {};
    for (const p of progress) {
      progressMap[p.lessonId] = {
        lessonId: p.lessonId,
        completed: p.completed,
        inProgress: !p.completed && p.attempts > 0,
        bestWpm: p.bestWpm,
        bestAccuracy: p.bestAccuracy,
        attempts: p.attempts,
      };
    }
    return progressMap;
  },

  async getLessonState(sessionId: string, lessonId: string) {
    await this.ensureUser(sessionId);
    // Find highest completed exercise
    const exercises = await db.select().from(exerciseProgress)
      .where(and(eq(exerciseProgress.userId, sessionId), eq(exerciseProgress.lessonId, lessonId)))
      .orderBy(desc(exerciseProgress.updatedAt));
    
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return { nextExerciseIndex: 0 };

    const completedSet = new Set(exercises.filter(e => e.passed).map(e => e.exerciseId));
    
    // Find the first exercise that is NOT completed
    let nextExerciseIndex = 0;
    for (let i = 0; i < lesson.exercises.length; i++) {
      if (!completedSet.has(lesson.exercises[i].id)) {
        nextExerciseIndex = i;
        break;
      }
    }

    // If all completed, return the last exercise index to show completion
    if (nextExerciseIndex === 0 && completedSet.size === lesson.exercises.length) {
      nextExerciseIndex = lesson.exercises.length - 1;
    }

    return { nextExerciseIndex, completedExercises: Array.from(completedSet) };
  },

  async isLessonUnlocked(sessionId: string, lessonId: string) {
    const completed = await db
      .select({ lessonId: lessonProgress.lessonId })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, sessionId), eq(lessonProgress.completed, true)));
    return isLessonUnlocked(lessonId, new Set(completed.map((p) => p.lessonId)));
  },

  // Whether the exercise passed and whether the lesson is complete are decided
  // here from the lesson requirements, never taken from the client.
  // Every write is a single upsert so concurrent saves can't lose updates.
  async saveExerciseResult(
    sessionId: string,
    lessonId: string,
    exerciseId: string,
    stats: { wpm: number; accuracy: number },
  ) {
    const evaluation = evaluateExercise(lessonId, exerciseId, stats);
    if (!evaluation) {
      throw new Error(`Unknown exercise ${exerciseId} in lesson ${lessonId}`);
    }
    const lesson = lessons.find((l) => l.id === lessonId)!;

    await this.ensureUser(sessionId);

    // A passed exercise stays passed when retried with worse results
    await db.insert(exerciseProgress).values({
      userId: sessionId,
      lessonId,
      exerciseId,
      passed: evaluation.passed,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
    }).onConflictDoUpdate({
      target: [exerciseProgress.userId, exerciseProgress.lessonId, exerciseProgress.exerciseId],
      set: {
        passed: sql`${exerciseProgress.passed} OR excluded.passed`,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        updatedAt: new Date(),
      }
    });

    // Passed flags only ever go from false to true, so reading them after our
    // own write can't undo a completion: `completed` is OR-ed below.
    const passedExercises = await db
      .select({ exerciseId: exerciseProgress.exerciseId })
      .from(exerciseProgress)
      .where(and(
        eq(exerciseProgress.userId, sessionId),
        eq(exerciseProgress.lessonId, lessonId),
        eq(exerciseProgress.passed, true),
      ));
    const passedIds = new Set(passedExercises.map((e) => e.exerciseId));
    const completed = lesson.exercises.every((e) => passedIds.has(e.id));

    await db.insert(lessonProgress).values({
      userId: sessionId,
      lessonId,
      completed,
      bestWpm: stats.wpm,
      bestAccuracy: stats.accuracy,
      attempts: 1,
    }).onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        completed: sql`${lessonProgress.completed} OR excluded.completed`,
        bestWpm: sql`GREATEST(${lessonProgress.bestWpm}, excluded.best_wpm)`,
        bestAccuracy: sql`GREATEST(${lessonProgress.bestAccuracy}, excluded.best_accuracy)`,
        attempts: sql`${lessonProgress.attempts} + 1`,
        updatedAt: new Date(),
      }
    });
  },

  async saveFreePracticeResult(
    sessionId: string,
    language: string,
    stats: { wpm: number; accuracy: number; elapsedTime: number }
  ) {
    await this.ensureUser(sessionId);
    
    // Guardar estadísticas de práctica libre
    await db.insert(freePracticeStats).values({
      userId: sessionId,
      language: language,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
      duration: Math.round(stats.elapsedTime / 1000), // convert ms to seconds
    });
  },

  async getUserSettings(sessionId: string) {
    await this.ensureUser(sessionId);
    const result = await db.select().from(userSettings).where(eq(userSettings.userId, sessionId));
    if (result.length === 0) {
      // Return defaults
      return { layoutVariant: DEFAULT_LAYOUT };
    }
    return result[0];
  },

  async updateUserSettings(sessionId: string, variant: string) {
    await this.ensureUser(sessionId);
    await db.insert(userSettings)
      .values({
        userId: sessionId,
        layoutVariant: variant,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          layoutVariant: variant,
          updatedAt: new Date(),
        }
      });
  }
};
