import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Arbitrary constant shared by every instance, so only one runs migrations at a time.
const MIGRATION_LOCK_ID = 727_001;

interface Journal {
  entries: { idx: number; when: number; tag: string }[];
}

/**
 * Applies pending Drizzle migrations from `migrationsFolder`.
 *
 * Databases created with `drizzle-kit push` have the initial tables but no
 * migration history, so replaying 0000 would fail with "relation already
 * exists". In that case the initial migration is recorded as applied first
 * (baseline) and only later migrations run.
 */
export async function runMigrations(
  connectionString: string,
  migrationsFolder: string,
) {
  // A single dedicated connection: advisory locks are session-scoped.
  const client = postgres(connectionString, { max: 1, onnotice: () => {} });
  try {
    await client`select pg_advisory_lock(${MIGRATION_LOCK_ID})`;
    await baselineIfNeeded(client, migrationsFolder);
    await migrate(drizzle(client), { migrationsFolder });
    await client`select pg_advisory_unlock(${MIGRATION_LOCK_ID})`;
  } finally {
    await client.end();
  }
}

async function baselineIfNeeded(
  client: postgres.Sql,
  migrationsFolder: string,
) {
  const [{ hasHistory, hasSchema }] = await client<
    { hasHistory: boolean; hasSchema: boolean }[]
  >`
    select
      to_regclass('drizzle.__drizzle_migrations') is not null as "hasHistory",
      to_regclass('public.users') is not null as "hasSchema"
  `;
  if (!hasSchema) return;
  if (hasHistory) {
    const [{ count }] = await client<{ count: number }[]>`
      select count(*)::int as count from drizzle.__drizzle_migrations
    `;
    if (count > 0) return;
  }

  const journal: Journal = JSON.parse(
    readFileSync(join(migrationsFolder, "meta", "_journal.json"), "utf8"),
  );
  const initial = journal.entries.find((entry) => entry.idx === 0);
  if (!initial) return;

  const initialSql = readFileSync(
    join(migrationsFolder, `${initial.tag}.sql`),
    "utf8",
  );
  const hash = createHash("sha256").update(initialSql).digest("hex");

  await client`create schema if not exists drizzle`;
  await client`
    create table if not exists drizzle.__drizzle_migrations (
      id serial primary key,
      hash text not null,
      created_at bigint
    )
  `;
  await client`
    insert into drizzle.__drizzle_migrations (hash, created_at)
    values (${hash}, ${initial.when})
  `;
  console.log(`Baselined existing database at migration ${initial.tag}`);
}
