import { profiles } from "@/db/schema";
import type { AppDatabase } from "@/db/types";

/** Creates the user's profile on first use. Safe to call on every request. */
export async function ensureProfile(db: AppDatabase, userId: string, displayName: string | null) {
  await db.insert(profiles).values({ userId, displayName }).onConflictDoNothing({ target: profiles.userId });
}
