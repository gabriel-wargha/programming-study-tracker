import "server-only";

import { and, asc, eq, type SQL } from "drizzle-orm";
import { goalActivitySummary, goals, profiles, topics } from "@/db/schema";
import type { GoalSummary } from "@/features/goals/schemas";
import type { UserScope } from "@/lib/auth/scope";
import type { ActiveGoalLink } from "@/lib/forms/action-state";
import { isUuid } from "@/lib/ids";

export type GoalDetailData = GoalSummary & { topicArchived: boolean };

const statusOrder = { active: 0, planned: 1, completed: 2, archived: 3 } as const;

/** Always scoped to the owner; `filter` can only narrow the result. */
function selectGoals({ db, userId }: UserScope, filter?: SQL) {
  return db.select({
    id: goals.id,
    topicId: goals.topicId,
    topicName: topics.name,
    topicArchivedAt: topics.archivedAt,
    title: goals.title,
    description: goals.description,
    definitionOfDone: goals.definitionOfDone,
    status: goals.status,
    targetDate: goals.targetDate,
  }).from(goals)
    .innerJoin(topics, and(eq(topics.id, goals.topicId), eq(topics.userId, goals.userId)))
    .where(and(eq(goals.userId, userId), filter));
}

type GoalRow = Awaited<ReturnType<ReturnType<typeof selectGoals>["execute"]>>[number];

function toDetail({ topicArchivedAt, ...goal }: GoalRow): GoalDetailData {
  return { ...goal, topicArchived: topicArchivedAt !== null };
}

/** Active goals first, then planned, completed, and archived, each by title. */
export async function listGoals(scope: UserScope, filters: { topicId?: string } = {}): Promise<GoalDetailData[]> {
  const rows = await selectGoals(scope, filters.topicId ? eq(goals.topicId, filters.topicId) : undefined);
  return rows.map(toDetail).sort((a, b) =>
    statusOrder[a.status] - statusOrder[b.status] || a.title.localeCompare(b.title));
}

export async function getGoal(scope: UserScope, id: string): Promise<GoalDetailData | null> {
  if (!isUuid(id)) return null;
  const [goal] = await selectGoals(scope, eq(goals.id, id));
  return goal ? toDetail(goal) : null;
}

export async function listActiveGoals(
  { db, userId }: UserScope,
  filters: { topicId?: string } = {},
): Promise<ActiveGoalLink[]> {
  const conditions: SQL[] = [eq(goals.userId, userId), eq(goals.status, "active")];
  if (filters.topicId) conditions.push(eq(goals.topicId, filters.topicId));
  return db.select({ id: goals.id, title: goals.title }).from(goals)
    .where(and(...conditions)).orderBy(asc(goals.title));
}

export async function getActiveGoalLimit({ db, userId }: UserScope): Promise<number> {
  const [profile] = await db.select({ limit: profiles.activeGoalLimit }).from(profiles)
    .where(eq(profiles.userId, userId));
  if (!profile) throw new Error("The signed-in user has no profile.");
  return profile.limit;
}

/** Totals from the summary view, plus what's needed to check whether the goal stalled. */
export async function getGoalActivitySummary({ db, userId }: UserScope, id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db.select({
    status: goals.status,
    startedAt: goals.startedAt,
    lastActivityOn: goalActivitySummary.lastActivityOn,
    activityCount: goalActivitySummary.activityCount,
    totalMinutes: goalActivitySummary.totalMinutes,
  }).from(goals)
    .leftJoin(goalActivitySummary, and(eq(goalActivitySummary.goalId, goals.id), eq(goalActivitySummary.userId, goals.userId)))
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));
  if (!row) return null;
  return { ...row, activityCount: row.activityCount ?? 0, totalMinutes: row.totalMinutes ?? 0 };
}
