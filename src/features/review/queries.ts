import "server-only";

import { and, asc, between, desc, eq, sql, type AnyColumn } from "drizzle-orm";
import { activities, blockers, goals, projects, topics } from "@/db/schema";
import type { ActivityType } from "@/features/activities/schemas";
import type { UserScope } from "@/lib/auth/scope";

export type ReviewActivity = { id: string; type: ActivityType; description: string; minutes: number | null; occurredOn: string; projectTitle: string | null };
export type ReviewGoal = { id: string; title: string; topicName: string; totalMinutes: number; activities: ReviewActivity[] };
export type ReviewProject = { id: string; title: string; activityCount: number; totalMinutes: number };
export type WeeklyReview = {
  totalMinutes: number;
  activityCount: number;
  goals: ReviewGoal[];
  projects: ReviewProject[];
  /** Goals that are active now and have no activity in this week. */
  idleGoals: { id: string; title: string; topicName: string }[];
  blockersOpened: ReviewBlocker[];
  blockersSolved: ReviewBlocker[];
};
export type ReviewBlocker = { id: string; title: string; goalId: string; goalTitle: string };

/** Calculated from existing data; every table is filtered by the owner. */
export async function getWeeklyReview(
  { db, userId }: UserScope,
  week: { start: string; end: string },
  timeZone = "UTC",
): Promise<WeeklyReview> {
  // Blockers carry timestamps, so the week is compared in the owner's time zone.
  const inWeek = (column: AnyColumn) => sql`(${column} at time zone ${timeZone})::date between ${week.start} and ${week.end}`;
  const selectBlockers = (column: AnyColumn) => db.select({ id: blockers.id, title: blockers.title, goalId: goals.id, goalTitle: goals.title })
    .from(blockers)
    .innerJoin(goals, and(eq(goals.id, blockers.goalId), eq(goals.userId, blockers.userId)))
    .where(and(eq(blockers.userId, userId), inWeek(column)))
    .orderBy(asc(blockers.title));

  const [rows, active, blockersOpened, blockersSolved] = await Promise.all([
    db.select({
      id: activities.id,
      type: activities.type,
      description: activities.description,
      minutes: activities.minutes,
      occurredOn: activities.occurredOn,
      goalId: goals.id,
      goalTitle: goals.title,
      topicName: topics.name,
      projectId: projects.id,
      projectTitle: projects.title,
    }).from(activities)
      .innerJoin(goals, and(eq(goals.id, activities.goalId), eq(goals.userId, activities.userId)))
      .innerJoin(topics, and(eq(topics.id, goals.topicId), eq(topics.userId, goals.userId)))
      .leftJoin(projects, and(eq(projects.id, activities.projectId), eq(projects.userId, activities.userId)))
      .where(and(eq(activities.userId, userId), between(activities.occurredOn, week.start, week.end)))
      .orderBy(desc(activities.occurredOn), desc(activities.createdAt)),
    db.select({ id: goals.id, title: goals.title, topicName: topics.name }).from(goals)
      .innerJoin(topics, and(eq(topics.id, goals.topicId), eq(topics.userId, goals.userId)))
      .where(and(eq(goals.userId, userId), eq(goals.status, "active")))
      .orderBy(asc(goals.title)),
    selectBlockers(blockers.createdAt),
    selectBlockers(blockers.solvedAt),
  ]);

  const byGoal = new Map<string, ReviewGoal>();
  const byProject = new Map<string, ReviewProject>();
  let totalMinutes = 0;
  for (const row of rows) {
    const minutes = row.minutes ?? 0;
    totalMinutes += minutes;
    const goal = byGoal.get(row.goalId) ?? { id: row.goalId, title: row.goalTitle, topicName: row.topicName, totalMinutes: 0, activities: [] };
    goal.totalMinutes += minutes;
    goal.activities.push({
      id: row.id, type: row.type, description: row.description, minutes: row.minutes, occurredOn: row.occurredOn, projectTitle: row.projectTitle,
    });
    byGoal.set(row.goalId, goal);
    if (row.projectId && row.projectTitle) {
      const project = byProject.get(row.projectId) ?? { id: row.projectId, title: row.projectTitle, activityCount: 0, totalMinutes: 0 };
      project.activityCount += 1;
      project.totalMinutes += minutes;
      byProject.set(row.projectId, project);
    }
  }
  return {
    totalMinutes,
    activityCount: rows.length,
    goals: [...byGoal.values()].sort((a, b) => a.title.localeCompare(b.title)),
    projects: [...byProject.values()].sort((a, b) => a.title.localeCompare(b.title)),
    idleGoals: active.filter((goal) => !byGoal.has(goal.id)),
    blockersOpened,
    blockersSolved,
  };
}
