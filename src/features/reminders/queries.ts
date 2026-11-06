import "server-only";

import { and, asc, eq, isNull, lte } from "drizzle-orm";
import { goals, reviewReminders, topics } from "@/db/schema";
import type { UserScope } from "@/lib/auth/scope";

export type DueReminder = { id: string; stage: number; dueOn: string; goalId: string; goalTitle: string; topicName: string };

/** Unfinished reminders due today or earlier, for goals that are still completed. */
export async function listDueReminders({ db, userId }: UserScope, today: string): Promise<DueReminder[]> {
  return db.select({
    id: reviewReminders.id,
    stage: reviewReminders.stage,
    dueOn: reviewReminders.dueOn,
    goalId: goals.id,
    goalTitle: goals.title,
    topicName: topics.name,
  }).from(reviewReminders)
    .innerJoin(goals, and(eq(goals.id, reviewReminders.goalId), eq(goals.userId, reviewReminders.userId)))
    .innerJoin(topics, and(eq(topics.id, goals.topicId), eq(topics.userId, goals.userId)))
    .where(and(
      eq(reviewReminders.userId, userId),
      isNull(reviewReminders.completedAt),
      lte(reviewReminders.dueOn, today),
      eq(goals.status, "completed"),
    ))
    .orderBy(asc(reviewReminders.dueOn), asc(goals.title));
}
