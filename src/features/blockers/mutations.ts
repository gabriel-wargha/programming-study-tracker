import "server-only";

import { and, eq } from "drizzle-orm";
import { blockers } from "@/db/schema";
import type { BlockerField, SolveField } from "@/features/blockers/schemas";
import type { UserScope } from "@/lib/auth/scope";
import { databaseErrorCode, postgresErrorCodes } from "@/lib/db/errors";
import type { FormResult } from "@/lib/forms/action-state";

const notFound = { ok: false, error: "This blocker could not be found." } as const;

export async function createBlocker(
  { db, userId }: UserScope,
  input: { goalId: string; title: string; details: string | null },
): Promise<FormResult<BlockerField, { id: string }>> {
  try {
    const [blocker] = await db.insert(blockers).values({ userId, ...input }).returning({ id: blockers.id });
    return { ok: true, data: blocker };
  } catch (error) {
    if (databaseErrorCode(error) === postgresErrorCodes.foreignKeyViolation) {
      return { ok: false, error: "This goal could not be found." };
    }
    throw error;
  }
}

export async function solveBlocker({ db, userId }: UserScope, id: string, solution: string): Promise<FormResult<SolveField, { id: string }>> {
  const [blocker] = await db.update(blockers).set({ status: "solved", solution })
    .where(and(eq(blockers.id, id), eq(blockers.userId, userId))).returning({ id: blockers.id });
  return blocker ? { ok: true, data: blocker } : notFound;
}

/** Keeps the earlier solution text as a note; the blocker is open again. */
export async function reopenBlocker({ db, userId }: UserScope, id: string): Promise<FormResult<"id", { id: string }>> {
  const [blocker] = await db.update(blockers).set({ status: "open" })
    .where(and(eq(blockers.id, id), eq(blockers.userId, userId))).returning({ id: blockers.id });
  return blocker ? { ok: true, data: blocker } : notFound;
}
