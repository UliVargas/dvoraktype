import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// The local fallback matches compose.yml and is only for development.
// The production server refuses to start without DATABASE_URL (entry.express.tsx);
// the check can't live here because the build imports this module too.
export const connectionString =
  process.env.DATABASE_URL ||
  "postgres://admin:password@localhost:5432/dvorak_db";

const queryClient = postgres(connectionString, {
  max: 10, // connections in the pool
  idle_timeout: 20, // seconds before an idle connection is closed
  max_lifetime: 60 * 30, // seconds before a connection is recycled
});
export const db = drizzle(queryClient, { schema });

/** Round trip to the database, for health checks. */
export const pingDb = () => queryClient`select 1`;

/** Closes the connection pool (used by tests and graceful shutdown). */
export const closeDb = () => queryClient.end();
