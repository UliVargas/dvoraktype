-- Hand-edited after drizzle-kit generate, for databases that already hold data:
-- - timestamps are converted as UTC explicitly instead of the session time zone;
-- - rows saved before validation existed are clamped into range before the range
--   checks are added: a NOT VALID check would still reject every later UPDATE of
--   such a row (best-of upserts keep the stored value), and these values are
--   impossible anyway (over 300 WPM or 100% accuracy);
-- - IF EXISTS / IF NOT EXISTS because production was created with drizzle-kit push.
ALTER TABLE "exercise_progress" DROP CONSTRAINT IF EXISTS "exercise_progress_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "feedbacks" DROP CONSTRAINT IF EXISTS "feedbacks_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "free_practice_stats" DROP CONSTRAINT IF EXISTS "free_practice_stats_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "lesson_progress" DROP CONSTRAINT IF EXISTS "lesson_progress_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_settings" DROP CONSTRAINT IF EXISTS "user_settings_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "exercise_progress" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "exercise_progress" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "feedbacks" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "feedbacks" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "free_practice_stats" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "free_practice_stats" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "lesson_progress" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "lesson_progress" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "user_settings" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at" AT TIME ZONE 'UTC';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "exercise_progress" ADD CONSTRAINT "exercise_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_practice_stats" ADD CONSTRAINT "free_practice_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedbacks_user_idx" ON "feedbacks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "free_practice_stats_user_idx" ON "free_practice_stats" USING btree ("user_id");--> statement-breakpoint
UPDATE "exercise_progress" SET "wpm" = LEAST(GREATEST("wpm", 0), 300), "accuracy" = LEAST(GREATEST("accuracy", 0), 100) WHERE "wpm" NOT BETWEEN 0 AND 300 OR "accuracy" NOT BETWEEN 0 AND 100;--> statement-breakpoint
UPDATE "free_practice_stats" SET "wpm" = LEAST(GREATEST("wpm", 0), 300), "accuracy" = LEAST(GREATEST("accuracy", 0), 100) WHERE "wpm" NOT BETWEEN 0 AND 300 OR "accuracy" NOT BETWEEN 0 AND 100;--> statement-breakpoint
UPDATE "lesson_progress" SET "best_wpm" = LEAST(GREATEST("best_wpm", 0), 300), "best_accuracy" = LEAST(GREATEST("best_accuracy", 0), 100) WHERE "best_wpm" NOT BETWEEN 0 AND 300 OR "best_accuracy" NOT BETWEEN 0 AND 100;--> statement-breakpoint
ALTER TABLE "exercise_progress" ADD CONSTRAINT "exercise_progress_wpm_range" CHECK (wpm between 0 and 300);--> statement-breakpoint
ALTER TABLE "exercise_progress" ADD CONSTRAINT "exercise_progress_accuracy_range" CHECK (accuracy between 0 and 100);--> statement-breakpoint
ALTER TABLE "free_practice_stats" ADD CONSTRAINT "free_practice_stats_wpm_range" CHECK (wpm between 0 and 300);--> statement-breakpoint
ALTER TABLE "free_practice_stats" ADD CONSTRAINT "free_practice_stats_accuracy_range" CHECK (accuracy between 0 and 100);--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_best_wpm_range" CHECK (best_wpm between 0 and 300);--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_best_accuracy_range" CHECK (best_accuracy between 0 and 100);