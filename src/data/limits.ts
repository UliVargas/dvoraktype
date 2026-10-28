// Ranges for typing results, shared by server validation
// (src/server/progress-rules.ts) and database CHECK constraints (src/db/schema.ts).
// Changing them needs a migration for the CHECKs too.
export const MAX_WPM = 300;
export const MAX_ACCURACY = 100;
