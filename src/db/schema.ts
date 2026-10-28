import { sql } from "drizzle-orm";
import { MAX_ACCURACY, MAX_WPM } from "../data/limits";
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";

// Timestamps carry their time zone so reads don't depend on the server's
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

// Same ranges the server validates
const wpmInRange = (column: string) =>
  sql.raw(`${column} between 0 and ${MAX_WPM}`);
const accuracyInRange = (column: string) =>
  sql.raw(`${column} between 0 and ${MAX_ACCURACY}`);

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Session ID
  createdAt: createdAt(),
});

// Everything a user owns is deleted with the user
const userId = () =>
  text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: userId(),
    lessonId: text("lesson_id").notNull(),
    completed: boolean("completed").default(false).notNull(),
    bestWpm: integer("best_wpm").default(0).notNull(),
    bestAccuracy: integer("best_accuracy").default(0).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("user_lesson_idx").on(table.userId, table.lessonId),
    check("lesson_progress_best_wpm_range", wpmInRange("best_wpm")),
    check("lesson_progress_best_accuracy_range", accuracyInRange("best_accuracy")),
  ],
);

export const exerciseProgress = pgTable(
  "exercise_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: userId(),
    lessonId: text("lesson_id").notNull(),
    exerciseId: text("exercise_id").notNull(),
    passed: boolean("passed").default(false).notNull(),
    wpm: integer("wpm").default(0).notNull(),
    accuracy: integer("accuracy").default(0).notNull(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("user_lesson_exercise_idx").on(
      table.userId,
      table.lessonId,
      table.exerciseId,
    ),
    check("exercise_progress_wpm_range", wpmInRange("wpm")),
    check("exercise_progress_accuracy_range", accuracyInRange("accuracy")),
  ],
);

export const freePracticeStats = pgTable(
  "free_practice_stats",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: userId(),
    language: text("language").notNull(), // 'es' or 'en'
    wpm: integer("wpm").notNull(),
    accuracy: integer("accuracy").notNull(),
    duration: integer("duration").notNull(), // duration in seconds
    createdAt: createdAt(),
  },
  (table) => [
    index("free_practice_stats_user_idx").on(table.userId),
    check("free_practice_stats_wpm_range", wpmInRange("wpm")),
    check("free_practice_stats_accuracy_range", accuracyInRange("accuracy")),
  ],
);

export const userSettings = pgTable("user_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: userId().unique(),
  layoutVariant: text("layout_variant").default("es-dvorak-xkb").notNull(),
  updatedAt: updatedAt(),
});

export const feedbacks = pgTable(
  "feedbacks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: userId(),
    type: text("type").notNull(), // 'suggestion' | 'bug' | 'other'
    message: text("message").notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("feedbacks_user_idx").on(table.userId)],
);
