import "server-only";

import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { goals, topicPrerequisites, topics } from "@/db/schema";
import { buildRoadmap, type RoadmapTopic } from "@/features/roadmap/order";
import type { UserScope } from "@/lib/auth/scope";
import { isUuid } from "@/lib/ids";

/** A prerequisite counts as finished when it has at least one completed goal. */
async function finishedTopicIds({ db, userId }: UserScope) {
  const rows = await db.selectDistinct({ id: goals.topicId }).from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.status, "completed")));
  return new Set(rows.map((row) => row.id));
}

export async function getRoadmap(scope: UserScope) {
  const { db, userId } = scope;
  const [all, edges, finished] = await Promise.all([
    db.select({ id: topics.id, name: topics.name, archivedAt: topics.archivedAt }).from(topics)
      .where(eq(topics.userId, userId)).orderBy(asc(sql`lower(${topics.name})`)),
    db.select({ topicId: topicPrerequisites.topicId, prerequisiteTopicId: topicPrerequisites.prerequisiteTopicId })
      .from(topicPrerequisites).where(eq(topicPrerequisites.userId, userId)),
    finishedTopicIds(scope),
  ]);
  const open: RoadmapTopic[] = all.filter((topic) => !topic.archivedAt).map(({ id, name }) => ({ id, name }));
  return { stages: buildRoadmap(open, edges, all, finished), options: open, edges };
}

/** Prerequisites without a completed goal, for the warning on topic and goal pages. */
export async function listUnfinishedPrerequisites(scope: UserScope, topicId: string): Promise<RoadmapTopic[]> {
  if (!isUuid(topicId)) return [];
  const { db, userId } = scope;
  const [rows, finished] = await Promise.all([
    db.select({ id: topics.id, name: topics.name }).from(topicPrerequisites)
      .innerJoin(topics, and(eq(topics.id, topicPrerequisites.prerequisiteTopicId), eq(topics.userId, topicPrerequisites.userId)))
      .where(and(eq(topicPrerequisites.userId, userId), eq(topicPrerequisites.topicId, topicId), isNull(topics.archivedAt)))
      .orderBy(asc(sql`lower(${topics.name})`)),
    finishedTopicIds(scope),
  ]);
  return rows.filter((row) => !finished.has(row.id));
}
