import "server-only";

import { and, desc, eq, type SQL } from "drizzle-orm";
import { activities, projects, resources } from "@/db/schema";
import type { ActivityItem } from "@/features/activities/schemas";
import type { UserScope } from "@/lib/auth/scope";
import { isUuid } from "@/lib/ids";

/** Always scoped to the owner; `filter` can only narrow the result. Newest first. */
async function selectActivities({ db, userId }: UserScope, filter?: SQL): Promise<ActivityItem[]> {
  const rows = await db.select({
    id: activities.id,
    type: activities.type,
    description: activities.description,
    minutes: activities.minutes,
    occurredOn: activities.occurredOn,
    projectId: projects.id,
    projectTitle: projects.title,
    resourceId: resources.id,
    resourceTitle: resources.title,
    resourceUrl: resources.url,
  }).from(activities)
    .leftJoin(projects, and(eq(projects.id, activities.projectId), eq(projects.userId, activities.userId)))
    .leftJoin(resources, and(eq(resources.id, activities.resourceId), eq(resources.userId, activities.userId)))
    .where(and(eq(activities.userId, userId), filter))
    .orderBy(desc(activities.occurredOn), desc(activities.createdAt));
  return rows.map(({ projectId, projectTitle, resourceId, resourceTitle, resourceUrl, ...activity }) => ({
    ...activity,
    project: projectId && projectTitle ? { id: projectId, title: projectTitle } : null,
    resource: resourceId && resourceTitle ? { id: resourceId, title: resourceTitle, url: resourceUrl } : null,
  }));
}

export async function listGoalActivities(scope: UserScope, goalId: string): Promise<ActivityItem[]> {
  if (!isUuid(goalId)) return [];
  return selectActivities(scope, eq(activities.goalId, goalId));
}
