import "server-only";

import { and, asc, eq, isNull, or, sql, type SQL } from "drizzle-orm";
import { goals, topics } from "@/db/schema";
import type { TopicOption } from "@/features/goals/schemas";
import type { TopicSummary } from "@/features/topics/schemas";
import type { UserScope } from "@/lib/auth/scope";
import { isUuid } from "@/lib/ids";

const topicSummaryColumns = {
  id: topics.id,
  name: topics.name,
  description: topics.description,
  archived: sql<boolean>`${topics.archivedAt} is not null`,
  goalCount: sql<number>`count(${goals.id})::int`,
};

/** Always scoped to the owner; `filter` can only narrow the result. */
function summaries({ db, userId }: UserScope, filter?: SQL) {
  return db.select(topicSummaryColumns).from(topics)
    .leftJoin(goals, and(eq(goals.topicId, topics.id), eq(goals.userId, topics.userId)))
    .where(and(eq(topics.userId, userId), filter))
    .groupBy(topics.id);
}

/** Open topics first, then archived, each by name. */
export async function listTopics(scope: UserScope): Promise<TopicSummary[]> {
  return summaries(scope)
    .orderBy(asc(sql`${topics.archivedAt} is not null`), asc(sql`lower(${topics.name})`));
}

export async function getTopic(scope: UserScope, id: string): Promise<TopicSummary | null> {
  if (!isUuid(id)) return null;
  const [topic] = await summaries(scope, eq(topics.id, id));
  return topic ?? null;
}

/** Topics a goal can be placed in: open topics, plus the goal's current topic when editing. */
export async function listTopicOptions(scope: UserScope, currentTopicId?: string): Promise<TopicOption[]> {
  const open = isNull(topics.archivedAt);
  return scope.db.select({ id: topics.id, name: topics.name }).from(topics)
    .where(and(eq(topics.userId, scope.userId), currentTopicId ? or(open, eq(topics.id, currentTopicId)) : open))
    .orderBy(asc(sql`lower(${topics.name})`));
}
