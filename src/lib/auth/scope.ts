import "server-only";

import { getDatabase } from "@/db/client";
import type { AppDatabase } from "@/db/types";
import { requireUser } from "@/lib/auth/require-user";

/** A database handle bound to the verified user. Queries and mutations take one. */
export type UserScope = { db: AppDatabase; userId: string };

export async function requireScope(): Promise<UserScope> {
  const user = await requireUser();
  return { db: await getDatabase(), userId: user.id };
}
