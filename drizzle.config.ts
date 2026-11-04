import { defineConfig } from "drizzle-kit";

// Generating migrations needs no database connection. Migrations are applied
// by scripts/migrate.ts (PGlite now; Neon in Phase 8).
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
});
