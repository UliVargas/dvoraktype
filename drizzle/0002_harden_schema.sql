-- Hand-edited after drizzle-kit generate, for databases that already hold data:
-- - timestamps are converted as UTC explicitly instead of the session time zone;
-- - range checks are NOT VALID, so rows saved before validation existed don't
--   block the migration while every new or updated row is checked;
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
ALTER TABLE "exercise_progress" ADD CONSTRAINT "exercise_progress_wpm_range" CHECK (wpm between 0 and 300) NOT VALID;--> statement-breakpoint
ALTER TABLE "exercise_progress" ADD CONSTRAINT "exercise_progress_accuracy_range" CHECK (accuracy between 0 and 100) NOT VALID;--> statement-breakpoint
ALTER TABLE "free_practice_stats" ADD CONSTRAINT "free_practice_stats_wpm_range" CHECK (wpm between 0 and 300) NOT VALID;--> statement-breakpoint
ALTER TABLE "free_practice_stats" ADD CONSTRAINT "free_practice_stats_accuracy_range" CHECK (accuracy between 0 and 100) NOT VALID;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_best_wpm_range" CHECK (best_wpm between 0 and 300) NOT VALID;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_best_accuracy_range" CHECK (best_accuracy between 0 and 100) NOT VALID;