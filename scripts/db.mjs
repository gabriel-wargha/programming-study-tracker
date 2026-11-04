// Local PGlite database tasks. Stop `npm run dev` first: PGlite allows one process at a time.
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

const command = process.argv[2];
const dataDir = process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), ".data", "pglite");

if (command !== "migrate" && command !== "reset") {
  console.error("Usage: node scripts/db.mjs <migrate|reset>");
  process.exit(1);
}
if (command === "reset") {
  rmSync(dataDir, { recursive: true, force: true });
  console.log(`Deleted the local database at ${path.relative(process.cwd(), dataDir)}.`);
}

mkdirSync(dataDir, { recursive: true });
const client = await PGlite.create({ dataDir });
try {
  await migrate(drizzle({ client }), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.log("Applied all migrations to the local database.");
} finally {
  await client.close();
}
