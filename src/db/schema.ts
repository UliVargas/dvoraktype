import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Session ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    lessonId: text("lesson_id").notNull(),
    completed: boolean("completed").default(false).notNull(),
    bestWpm: integer("best_wpm").default(0).notNull(),
    bestAccuracy: integer("best_accuracy").default(0).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      userLessonIdx: uniqueIndex("user_lesson_idx").on(
        table.userId,
        table.lessonId,
      ),
    };
  },
);

export const exerciseProgress = pgTable(
  "exercise_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    lessonId: text("lesson_id").notNull(),
    exerciseId: text("exercise_id").notNull(),
    passed: boolean("passed").default(false).notNull(),
    wpm: integer("wpm").default(0).notNull(),
    accuracy: integer("accuracy").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => {
    return {
      userLessonExerciseIdx: uniqueIndex("user_lesson_exercise_idx").on(
        table.userId,
        table.lessonId,
        table.exerciseId,
      ),
    };
  },
);

export const freePracticeStats = pgTable("free_practice_stats", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  language: text("language").notNull(), // 'es' or 'en'
  wpm: integer("wpm").notNull(),
  accuracy: integer("accuracy").notNull(),
  duration: integer("duration").notNull(), // duration in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
  layoutVariant: text("layout_variant").default("es-dvorak-xkb").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feedbacks = pgTable("feedbacks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(), // 'suggestion' | 'bug' | 'other'
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
