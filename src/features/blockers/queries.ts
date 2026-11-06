import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { blockers } from "@/db/schema";
import type { BlockerItem } from "@/features/blockers/schemas";
import type { UserScope } from "@/lib/auth/scope";
import { isUuid } from "@/lib/ids";

/** Open blockers first, then solved, newest first within each. */
export async function listGoalBlockers({ db, userId }: UserScope, goalId: string): Promise<BlockerItem[]> {
  if (!isUuid(goalId)) return [];
  return db.select({
    id: blockers.id, title: blockers.title, details: blockers.details, status: blockers.status,
    solution: blockers.solution, solvedAt: blockers.solvedAt, createdAt: blockers.createdAt,
  }).from(blockers)
    .where(and(eq(blockers.userId, userId), eq(blockers.goalId, goalId)))
    .orderBy(asc(blockers.status), desc(blockers.createdAt));
}
