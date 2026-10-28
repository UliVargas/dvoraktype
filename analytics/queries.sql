-- ============================================================================
-- Product analytics on the existing tables (read-only)
-- ============================================================================
--
-- Purpose: measure activation, progression and return before deciding how to
-- monetize. Every query only reads; run them one at a time with psql against
-- the production database (Railway: `railway connect Postgres`, or
-- `psql "$DATABASE_URL" -f analytics/queries.sql`).
--
-- What the data can and can't tell:
-- - `users` holds one row per cookie session, created on the first page view,
--   crawlers included. "Active" sessions below are the ones with any learning
--   activity (a lesson attempt or a free practice run); use those, not `users`,
--   as the base for every rate. Query 2 also counts exercise saves as activity
--   to date it: an exercise save always writes its lesson row too.
-- - A person who clears cookies or switches device counts as a new session.
-- - Progress rows keep only their LAST write time (`updated_at`), so "last
--   seen" is exact but intermediate visits are invisible. Return rates below
--   are therefore "came back at least once on a later day", a lower bound.
-- - Free practice keeps one row per finished phrase, with its own timestamp.
-- ============================================================================


-- 1. Overview -----------------------------------------------------------------
-- Sessions, how many did anything, and what they did.
WITH active AS (
  SELECT user_id FROM lesson_progress WHERE attempts > 0
  UNION
  SELECT user_id FROM free_practice_stats
)
SELECT
  (SELECT count(*) FROM users)                                     AS sessions,
  (SELECT count(*) FROM active)                                    AS active_sessions,
  round(100.0 * (SELECT count(*) FROM active)
        / nullif((SELECT count(*) FROM users), 0), 1)              AS active_pct,
  (SELECT count(DISTINCT user_id) FROM lesson_progress)            AS with_lessons,
  (SELECT count(DISTINCT user_id) FROM free_practice_stats)        AS with_free_practice,
  (SELECT count(DISTINCT user_id) FROM lesson_progress
     WHERE completed)                                              AS completed_a_lesson,
  (SELECT count(*) FROM feedbacks)                                 AS feedback_messages;


-- 2. New and active sessions per day (last 30 days) ----------------------------
-- "Active that day" = a session whose last lesson write or a practice run
-- happened that day (see the header: a lower bound).
WITH days AS (
  SELECT generate_series(current_date - 29, current_date, interval '1 day')::date AS day
),
activity AS (
  SELECT user_id, updated_at::date AS day FROM lesson_progress
  UNION
  SELECT user_id, updated_at::date FROM exercise_progress
  UNION
  SELECT user_id, created_at::date FROM free_practice_stats
)
SELECT
  d.day,
  (SELECT count(*) FROM users u WHERE u.created_at::date = d.day)        AS new_sessions,
  (SELECT count(DISTINCT a.user_id) FROM activity a WHERE a.day = d.day) AS active_sessions
FROM days d
ORDER BY d.day;


-- 3. Lesson funnel --------------------------------------------------------------
-- For each lesson: sessions that tried it and that completed it, as a share of
-- all active sessions, plus the share of sessions that completed the previous
-- lesson and also completed this one (same sessions, not two counts divided).
WITH active AS (
  SELECT user_id FROM lesson_progress WHERE attempts > 0
  UNION
  SELECT user_id FROM free_practice_stats
),
per_lesson AS (
  SELECT
    lesson_id,
    -- leccion-NN follows leccion-(NN-1)
    'leccion-' || lpad((substring(lesson_id FROM '\d+$')::int - 1)::text, 2, '0') AS previous_id,
    count(*) FILTER (WHERE attempts > 0) AS started,
    count(*) FILTER (WHERE completed)    AS completed,
    round(avg(attempts) FILTER (WHERE completed), 1) AS avg_attempts_to_complete
  FROM lesson_progress
  GROUP BY lesson_id
)
SELECT
  l.lesson_id,
  l.started,
  l.completed,
  round(100.0 * l.completed / nullif((SELECT count(*) FROM active), 0), 1) AS completed_pct_of_active,
  (SELECT round(100.0 * count(cur.user_id) / nullif(count(*), 0), 1)
     FROM lesson_progress prev
     LEFT JOIN lesson_progress cur
       ON cur.user_id = prev.user_id AND cur.lesson_id = l.lesson_id AND cur.completed
    WHERE prev.lesson_id = l.previous_id AND prev.completed)             AS kept_from_previous_pct,
  l.avg_attempts_to_complete
FROM per_lesson l
ORDER BY l.lesson_id;


-- 4. Where people get stuck inside a lesson -----------------------------------
-- Sessions that reached and passed each exercise. A large gap between
-- `reached` and `passed` marks an exercise that is too hard.
SELECT
  lesson_id,
  exercise_id,
  count(*)                          AS reached,
  count(*) FILTER (WHERE passed)    AS passed,
  round(100.0 * count(*) FILTER (WHERE passed) / count(*), 1) AS pass_pct,
  round(avg(wpm)) AS avg_last_wpm,
  round(avg(accuracy)) AS avg_last_accuracy
FROM exercise_progress
GROUP BY lesson_id, exercise_id
ORDER BY lesson_id, exercise_id;


-- 5. Return rate (did they come back on a later day?) -------------------------
-- Only sessions old enough to have had the chance (created 7+ days ago).
-- `last_seen` is the latest learning activity of the session.
WITH last_seen AS (
  SELECT user_id, max(t) AS last_seen
  FROM (
    SELECT user_id, updated_at AS t FROM lesson_progress
    UNION ALL SELECT user_id, updated_at FROM exercise_progress
    UNION ALL SELECT user_id, created_at FROM free_practice_stats
  ) activity
  GROUP BY user_id
)
SELECT
  date_trunc('week', u.created_at)::date                    AS cohort_week,
  count(*)                                                   AS active_sessions,
  count(*) FILTER (WHERE l.last_seen::date > u.created_at::date)          AS returned_later_day,
  count(*) FILTER (WHERE l.last_seen >= u.created_at + interval '7 days') AS active_after_7_days,
  round(100.0 * count(*) FILTER (WHERE l.last_seen::date > u.created_at::date) / count(*), 1) AS returned_pct,
  round(100.0 * count(*) FILTER (WHERE l.last_seen >= u.created_at + interval '7 days') / count(*), 1) AS after_7_days_pct
FROM users u
JOIN last_seen l ON l.user_id = u.id
WHERE u.created_at < now() - interval '7 days'
GROUP BY 1
ORDER BY 1;


-- 6. Depth: how far active sessions get ----------------------------------------
-- Distribution of completed lessons per active session (0 = practice only or
-- never finished a lesson).
WITH active AS (
  SELECT user_id FROM lesson_progress WHERE attempts > 0
  UNION
  SELECT user_id FROM free_practice_stats
)
SELECT
  coalesce(c.completed_lessons, 0) AS completed_lessons,
  count(*)                         AS sessions
FROM active a
LEFT JOIN (
  SELECT user_id, count(*) AS completed_lessons
  FROM lesson_progress WHERE completed GROUP BY user_id
) c ON c.user_id = a.user_id
GROUP BY 1
ORDER BY 1;


-- 7. Free practice usage -------------------------------------------------------
-- Runs are finished phrases. Minutes of practice is the strongest signal of
-- engagement the data has.
SELECT
  count(DISTINCT user_id)                                    AS sessions,
  count(*)                                                   AS runs,
  round(sum(duration) / 60.0)                                AS total_minutes,
  round(sum(duration) / 60.0 / nullif(count(DISTINCT user_id), 0), 1) AS minutes_per_session,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY wpm)           AS median_wpm,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY accuracy)      AS median_accuracy
FROM free_practice_stats;


-- 8. Layout mix -----------------------------------------------------------------
-- Which layout active sessions use (sessions that never changed it have no
-- settings row and are on the default, es-dvorak-xkb).
WITH active AS (
  SELECT user_id FROM lesson_progress WHERE attempts > 0
  UNION
  SELECT user_id FROM free_practice_stats
)
SELECT
  coalesce(s.layout_variant, 'es-dvorak-xkb (default)') AS layout,
  count(*) AS active_sessions,
  round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS pct
FROM active a
LEFT JOIN user_settings s ON s.user_id = a.user_id
GROUP BY 1
ORDER BY 2 DESC;


-- 9. Heavy users (who a paid tier would be for) --------------------------------
-- Sessions that completed 5+ lessons or practised 30+ minutes, with their
-- speed gain in free practice (first vs latest run).
WITH lessons AS (
  SELECT user_id, count(*) FILTER (WHERE completed) AS completed_lessons
  FROM lesson_progress GROUP BY user_id
),
practice AS (
  SELECT
    user_id,
    sum(duration) / 60.0 AS practice_minutes,
    count(*) AS runs,
    (array_agg(wpm ORDER BY created_at))[1]      AS first_wpm,
    (array_agg(wpm ORDER BY created_at DESC))[1] AS latest_wpm
  FROM free_practice_stats GROUP BY user_id
)
SELECT
  count(*)                                                     AS heavy_sessions,
  round(100.0 * count(*) / nullif((SELECT count(*) FROM (
    SELECT user_id FROM lesson_progress WHERE attempts > 0
    UNION SELECT user_id FROM free_practice_stats) a), 0), 1)  AS pct_of_active,
  round(avg(p.latest_wpm - p.first_wpm) FILTER (WHERE p.runs >= 2), 1) AS avg_wpm_gain_in_practice
FROM users u
LEFT JOIN lessons l  ON l.user_id = u.id
LEFT JOIN practice p ON p.user_id = u.id
WHERE coalesce(l.completed_lessons, 0) >= 5
   OR coalesce(p.practice_minutes, 0) >= 30;


-- 10. Feedback by type ----------------------------------------------------------
SELECT type, count(*) AS messages, max(created_at)::date AS latest
FROM feedbacks
GROUP BY type
ORDER BY messages DESC;
