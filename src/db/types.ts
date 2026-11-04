import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type * as schema from "@/db/schema";

/** Driver-independent database type, so PGlite and Neon share query code. */
export type AppDatabase = PgDatabase<PgQueryResultHKT, typeof schema>;
