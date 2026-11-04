import "server-only";

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { AppDatabase } from "@/db/types";
import * as schema from "@/db/schema";

const globalForDatabase = globalThis as typeof globalThis & {
  studyTrackerDatabase?: Promise<AppDatabase>;
};

export function localDataDirectory() {
  return process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), ".data", "pglite");
}

async function openLocalDatabase(): Promise<AppDatabase> {
  const dataDir = localDataDirectory();
  await mkdir(dataDir, { recursive: true });
  const client = await PGlite.create({ dataDir });
  const db = drizzle({ client, schema });
  // PGlite is a single-process database, so the dev server applies pending
  // migrations itself instead of sharing the files with another process.
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

/** The app's only database entry point. Neon is added here in Phase 8. */
export function getDatabase(): Promise<AppDatabase> {
  // One connection per server process; it survives dev hot reloads.
  globalForDatabase.studyTrackerDatabase ??= openLocalDatabase().catch((error: unknown) => {
    globalForDatabase.studyTrackerDatabase = undefined;
    throw error;
  });
  return globalForDatabase.studyTrackerDatabase;
}
