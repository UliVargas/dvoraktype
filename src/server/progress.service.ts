import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { users, lessonProgress, exerciseProgress, freePracticeStats, userSettings, feedbacks } from '../db/schema';
import { lessons } from '../data/lessons';
import type { TypingStats } from '../data/types';

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
    const existing = await db.select().from(users).where(eq(users.id, sessionId));
    if (existing.length === 0) {
      await db.insert(users).values({ id: sessionId });
    }
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

  async saveExerciseResult(
    sessionId: string, 
    lessonId: string, 
    exerciseId: string, 
    stats: TypingStats, 
    isLastExercise: boolean,
    passed: boolean
  ) {
    await this.ensureUser(sessionId);

    // Guardar progreso del ejercicio
    await db.insert(exerciseProgress).values({
      userId: sessionId,
      lessonId,
      exerciseId,
      passed,
      wpm: stats.wpm,
      accuracy: stats.accuracy,
    }).onConflictDoUpdate({
      target: [exerciseProgress.userId, exerciseProgress.lessonId, exerciseProgress.exerciseId],
      set: {
        passed: passed, // Podríamos hacer que si ya estaba pasado, no se quite, pero onConflict no lo permite fácilmente sin raw sql. Haremos un select primero para estar seguros, o confiaremos en que solo se avanza si pasa.
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        updatedAt: new Date(),
      }
    });

    // Actualizar progreso general de la lección
    const lp = await db.select().from(lessonProgress)
      .where(and(eq(lessonProgress.userId, sessionId), eq(lessonProgress.lessonId, lessonId)));
    
    const previous = lp[0];
    const isNowCompleted = previous?.completed || (passed && isLastExercise);
    const newBestWpm = Math.max(previous?.bestWpm || 0, stats.wpm);
    const newBestAcc = Math.max(previous?.bestAccuracy || 0, stats.accuracy);
    const newAttempts = (previous?.attempts || 0) + 1;

    await db.insert(lessonProgress).values({
      userId: sessionId,
      lessonId,
      completed: isNowCompleted,
      bestWpm: newBestWpm,
      bestAccuracy: newBestAcc,
      attempts: newAttempts,
    }).onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        completed: isNowCompleted,
        bestWpm: newBestWpm,
        bestAccuracy: newBestAcc,
        attempts: newAttempts,
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
      return { layoutVariant: 'es-dvorak-xkb' };
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
