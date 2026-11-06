import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import { reviewReminders } from "@/db/schema";
import type { AppDatabase } from "@/db/types";
import { firstReviewDue, secondReviewDue } from "@/features/reminders/rules";
import type { UserScope } from "@/lib/auth/scope";
import type { FormResult } from "@/lib/forms/action-state";

/** A transaction or the database itself; both can run these queries. */
type Writer = Pick<AppDatabase, "insert" | "update" | "delete">;

function upsertReminder(writer: Writer, reminder: { userId: string; goalId: string; stage: 1 | 2; dueOn: string }) {
  return writer.insert(reviewReminders).values(reminder).onConflictDoUpdate({
    target: [reviewReminders.goalId, reviewReminders.stage],
    set: { dueOn: reminder.dueOn, completedAt: null },
    // A goal belongs to one owner, but the update stays limited to that owner.
    setWhere: eq(reviewReminders.userId, reminder.userId),
  });
}

/** Completing a goal creates a reminder due 7 days later. Completing it again restarts the cycle. */
export function scheduleFirstReview(writer: Writer, userId: string, goalId: string, today: string) {
  return upsertReminder(writer, { userId, goalId, stage: 1, dueOn: firstReviewDue(today) });
}

/** Reopening a goal removes its unfinished reminders. */
export function removeUnfinishedReviews(writer: Writer, userId: string, goalId: string) {
  return writer.delete(reviewReminders).where(and(
    eq(reviewReminders.userId, userId), eq(reviewReminders.goalId, goalId), isNull(reviewReminders.completedAt),
  ));
}

/** Finishing the first review creates a second one due 30 days later. */
export async function finishReminder(
  { db, userId }: UserScope,
  id: string,
  today: string,
): Promise<FormResult<"id", { id: string }>> {
  return db.transaction(async (tx) => {
    const [reminder] = await tx.update(reviewReminders).set({ completedAt: sql`now()` })
      .where(and(eq(reviewReminders.id, id), eq(reviewReminders.userId, userId), isNull(reviewReminders.completedAt)))
      .returning({ id: reviewReminders.id, goalId: reviewReminders.goalId, stage: reviewReminders.stage });
    if (!reminder) return { ok: false, error: "This review could not be found or is already finished." };
    if (reminder.stage === 1) {
      await upsertReminder(tx, { userId, goalId: reminder.goalId, stage: 2, dueOn: secondReviewDue(today) });
    }
    return { ok: true, data: { id: reminder.id } };
  });
}
