import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import { topics } from "@/db/schema";
import { listActiveGoals } from "@/features/goals/queries";
import type { TopicField } from "@/features/topics/schemas";
import type { UserScope } from "@/lib/auth/scope";
import { databaseErrorCode, postgresErrorCodes, ruleErrorCodes } from "@/lib/db/errors";
import type { FormResult } from "@/lib/forms/action-state";

type TopicInput = { name: string; description: string | null };
type TopicResult = FormResult<TopicField, { id: string }>;

const notFound = { ok: false, error: "This topic could not be found." } as const;

function topicSaveFailure(error: unknown): TopicResult {
  if (databaseErrorCode(error) === postgresErrorCodes.uniqueViolation) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: { name: ["You already have a topic with this name."] },
    };
  }
  throw error;
}

export async function createTopic({ db, userId }: UserScope, input: TopicInput): Promise<TopicResult> {
  try {
    const [topic] = await db.insert(topics).values({ userId, ...input }).returning({ id: topics.id });
    return { ok: true, data: topic };
  } catch (error) {
    return topicSaveFailure(error);
  }
}

export async function updateTopic({ db, userId }: UserScope, id: string, input: TopicInput): Promise<TopicResult> {
  try {
    const [topic] = await db.update(topics).set(input)
      .where(and(eq(topics.id, id), eq(topics.userId, userId))).returning({ id: topics.id });
    return topic ? { ok: true, data: topic } : notFound;
  } catch (error) {
    return topicSaveFailure(error);
  }
}

export async function archiveTopic(scope: UserScope, id: string): Promise<FormResult<"id", { id: string }>> {
  try {
    const [topic] = await scope.db.update(topics).set({ archivedAt: sql`now()` })
      .where(and(eq(topics.id, id), eq(topics.userId, scope.userId), isNull(topics.archivedAt)))
      .returning({ id: topics.id });
    return topic ? { ok: true, data: topic } : { ok: false, error: "This topic could not be found or is already archived." };
  } catch (error) {
    if (databaseErrorCode(error) === ruleErrorCodes.topicHasActiveGoals) {
      return {
        ok: false,
        error: "A topic with active goals cannot be archived.",
        activeGoals: await listActiveGoals(scope, { topicId: id }),
      };
    }
    throw error;
  }
}
