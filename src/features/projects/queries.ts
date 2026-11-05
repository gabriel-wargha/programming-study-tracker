import "server-only";

import { and, asc, countDistinct, desc, eq, sql, type SQL } from "drizzle-orm";
import { activities, goals, projects, topics } from "@/db/schema";
import type { ProjectGoal, ProjectOption, ProjectSummary } from "@/features/projects/schemas";
import type { UserScope } from "@/lib/auth/scope";
import { isUuid } from "@/lib/ids";

/** Always scoped to the owner; `filter` can only narrow the result. */
function summaries({ db, userId }: UserScope, filter?: SQL) {
  return db.select({
    id: projects.id,
    title: projects.title,
    description: projects.description,
    repoUrl: projects.repoUrl,
    liveUrl: projects.liveUrl,
    activityCount: sql<number>`count(${activities.id})::int`,
    goalCount: sql<number>`${countDistinct(activities.goalId)}::int`,
    lastActivityOn: sql<string | null>`max(${activities.occurredOn})::text`,
  }).from(projects)
    .leftJoin(activities, and(eq(activities.projectId, projects.id), eq(activities.userId, projects.userId)))
    .where(and(eq(projects.userId, userId), filter))
    .groupBy(projects.id);
}

/** Most recently worked on first; projects with no activity last, newest first. */
export async function listProjects(scope: UserScope): Promise<ProjectSummary[]> {
  return summaries(scope).orderBy(
    sql`max(${activities.occurredOn}) desc nulls last`, desc(projects.createdAt),
  );
}

export async function getProject(scope: UserScope, id: string): Promise<ProjectSummary | null> {
  if (!isUuid(id)) return null;
  const [project] = await summaries(scope, eq(projects.id, id));
  return project ?? null;
}

export async function listProjectOptions({ db, userId }: UserScope): Promise<ProjectOption[]> {
  return db.select({ id: projects.id, title: projects.title }).from(projects)
    .where(eq(projects.userId, userId)).orderBy(asc(sql`lower(${projects.title})`));
}

/** Goals that have activities linked to the project, with their totals. */
export async function listProjectGoals({ db, userId }: UserScope, projectId: string): Promise<ProjectGoal[]> {
  if (!isUuid(projectId)) return [];
  return db.select({
    id: goals.id,
    title: goals.title,
    topicName: topics.name,
    activityCount: sql<number>`count(${activities.id})::int`,
    totalMinutes: sql<number>`coalesce(sum(${activities.minutes}), 0)::int`,
  }).from(activities)
    .innerJoin(goals, and(eq(goals.id, activities.goalId), eq(goals.userId, activities.userId)))
    .innerJoin(topics, and(eq(topics.id, goals.topicId), eq(topics.userId, goals.userId)))
    .where(and(eq(activities.userId, userId), eq(activities.projectId, projectId)))
    .groupBy(goals.id, topics.name)
    .orderBy(asc(goals.title));
}
