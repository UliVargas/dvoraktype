import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runMigrations } from "./migrate";

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

  it("gives up waiting for the migration lock after the lock timeout", async () => {
    const url = await freshDatabase();
    const holder = postgres(url, { max: 1, onnotice: () => {} });
    await holder`select pg_advisory_lock(727001)`;
    try {
      await expect(runMigrations(url, migrationsDir, { lockTimeoutMs: 300 })).rejects.toThrow(
        /lock timeout/i,
      );
    } finally {
      await holder.end();
    }
  });
});
