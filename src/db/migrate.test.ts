import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MIGRATION_LOCK_ID, runMigrations } from "./migrate";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const migrationsDir = join(__dirname, "..", "..", "drizzle");

// Each test gets its own throwaway database on the test server
describe.skipIf(!testDatabaseUrl)("runMigrations (Postgres)", () => {
  let admin: postgres.Sql;
  const created: string[] = [];

  beforeAll(() => {
    admin = postgres(testDatabaseUrl!, { max: 1, onnotice: () => {} });
  });

  afterAll(async () => {
    for (const name of created) await admin.unsafe(`drop database if exists "${name}" with (force)`);
    await admin.end();
  });

  async function freshDatabase() {
    const name = `mig_${crypto.randomUUID().replaceAll("-", "")}`;
    await admin.unsafe(`create database "${name}"`);
    created.push(name);
    const url = new URL(testDatabaseUrl!);
    url.pathname = `/${name}`;
    return url.toString();
  }

  it("refuses to baseline a database that has only some of the initial tables", async () => {
    const url = await freshDatabase();
    const db = postgres(url, { max: 1, onnotice: () => {} });
    // A partially pushed schema: users exists, the other initial tables don't
    await db`create table users (id text primary key, created_at timestamp default now() not null)`;
    await db.end();

    await expect(runMigrations(url, migrationsDir)).rejects.toThrow(
      /missing initial tables: .*lesson_progress/,
    );
  });

  it("baselines a database pushed from the full initial schema", async () => {
    const url = await freshDatabase();
    const db = postgres(url, { max: 1, onnotice: () => {} });
    await db.unsafe(readFileSync(join(migrationsDir, "0000_tricky_owl.sql"), "utf8").replaceAll("--> statement-breakpoint", ""));
    await db.end();

    await expect(runMigrations(url, migrationsDir)).resolves.toBeUndefined();
  });

  it("upgrades a database with existing data: keeps rows, converts timestamps as UTC", async () => {
    const url = await freshDatabase();
    // Bring the database to the state before the schema-hardening migration
    const db = postgres(url, { max: 1, onnotice: () => {} });
    for (const file of ["0000_tricky_owl.sql", "0001_ambitious_glorian.sql"]) {
      await db.unsafe(readFileSync(join(migrationsDir, file), "utf8").replaceAll("--> statement-breakpoint", ""));
    }
    await db`insert into users (id, created_at) values ('u1', '2026-01-02 03:04:05')`;
    // A legacy row saved before validation existed, out of today's ranges
    await db`insert into free_practice_stats (id, user_id, language, wpm, accuracy, duration) values (gen_random_uuid()::text, 'u1', 'es', 999, 150, 10)`;
    await db.end();

    await runMigrations(url, migrationsDir);

    const after = postgres(url, { max: 1, onnotice: () => {} });
    try {
      const [user] = await after`select created_at from users where id = 'u1'`;
      expect((user.created_at as Date).toISOString()).toBe("2026-01-02T03:04:05.000Z");
      const [{ count }] = await after`select count(*)::int as count from free_practice_stats`;
      expect(count).toBe(1);

      // New rows must respect the ranges
      await expect(
        after`insert into free_practice_stats (id, user_id, language, wpm, accuracy, duration) values (gen_random_uuid()::text, 'u1', 'es', 50, 101, 10)`,
      ).rejects.toThrow(/check constraint/);
      await expect(
        after`insert into exercise_progress (id, user_id, lesson_id, exercise_id, wpm, accuracy) values (gen_random_uuid()::text, 'u1', 'l', 'e', -1, 50)`,
      ).rejects.toThrow(/check constraint/);

      // Deleting a user removes everything that belongs to it
      await after`insert into user_settings (id, user_id) values (gen_random_uuid()::text, 'u1')`;
      await after`insert into feedbacks (id, user_id, type, message) values (gen_random_uuid()::text, 'u1', 'bug', 'mensaje de prueba')`;
      await after`delete from users where id = 'u1'`;
      const [{ left }] = await after`
        select (select count(*) from free_practice_stats) + (select count(*) from user_settings)
             + (select count(*) from feedbacks) as left`;
      expect(Number(left)).toBe(0);

      const indexes = await after<{ indexname: string }[]>`
        select indexname from pg_indexes where indexname in ('free_practice_stats_user_idx', 'feedbacks_user_idx')`;
      expect(indexes.map((i) => i.indexname).sort()).toEqual(["feedbacks_user_idx", "free_practice_stats_user_idx"]);
    } finally {
      await after.end();
    }
  });

  it("gives up waiting for the migration lock after the lock timeout", async () => {
    const url = await freshDatabase();
    const holder = postgres(url, { max: 1, onnotice: () => {} });
    await holder`select pg_advisory_lock(${MIGRATION_LOCK_ID})`;
    try {
      await expect(runMigrations(url, migrationsDir, { lockTimeoutMs: 300 })).rejects.toThrow(
        /lock timeout/i,
      );
    } finally {
      await holder.end();
    }
  });
});
