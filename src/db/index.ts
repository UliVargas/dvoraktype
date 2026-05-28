import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// This is required for Qwik to run correctly in server-side mode
// Avoid establishing connections at the module level if possible,
// but for a simple postgres setup, a singleton client is fine.
const connectionString =
  process.env.DATABASE_URL ||
  "postgres://admin:password@localhost:5432/dvorak_db";

const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
