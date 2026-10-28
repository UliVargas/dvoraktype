import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// The local fallback matches compose.yml and is only for development.
// The production server refuses to start without DATABASE_URL (entry.express.tsx);
// the check can't live here because the build imports this module too.
export const connectionString =
  process.env.DATABASE_URL ||
  "postgres://admin:password@localhost:5432/dvorak_db";

const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
