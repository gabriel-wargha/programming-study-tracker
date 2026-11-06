import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { topicPrerequisites, topics } from "@/db/schema";
import type { PrerequisiteField } from "@/features/roadmap/schemas";
import type { UserScope } from "@/lib/auth/scope";
import { databaseErrorCode, postgresErrorCodes, ruleErrorCodes } from "@/lib/db/errors";
import type { FormResult } from "@/lib/forms/action-state";

type Input = { topicId: string; prerequisiteTopicId: string };
type Result = FormResult<PrerequisiteField, Input>;

const fieldError = (message: string): Result => ({
  ok: false, error: "Check the highlighted fields.", fieldErrors: { prerequisiteTopicId: [message] },
});

export async function addPrerequisite({ db, userId }: UserScope, input: Input): Promise<Result> {
  // Check ownership first: the primary key would otherwise reveal another user's rows.
  const owned = await db.select({ id: topics.id }).from(topics)
    .where(and(eq(topics.userId, userId), inArray(topics.id, [input.topicId, input.prerequisiteTopicId])));
  if (owned.length !== new Set([input.topicId, input.prerequisiteTopicId]).size) return fieldError("Choose one of your topics.");
  try {
    await db.insert(topicPrerequisites).values({ userId, ...input });
    return { ok: true, data: input };
  } catch (error) {
    switch (databaseErrorCode(error)) {
      case ruleErrorCodes.prerequisiteLoop: return fieldError("That would create a loop, because this topic is already needed first.");
      case postgresErrorCodes.uniqueViolation: return fieldError("This topic is already a prerequisite.");
      case postgresErrorCodes.checkViolation: return fieldError("A topic can't be its own prerequisite.");
      case postgresErrorCodes.foreignKeyViolation: return fieldError("Choose one of your topics.");
      default: throw error;
    }
  }
}

export async function removePrerequisite({ db, userId }: UserScope, input: Input): Promise<Result> {
  const [removed] = await db.delete(topicPrerequisites).where(and(
    eq(topicPrerequisites.userId, userId),
    eq(topicPrerequisites.topicId, input.topicId),
    eq(topicPrerequisites.prerequisiteTopicId, input.prerequisiteTopicId),
  )).returning({ topicId: topicPrerequisites.topicId });
  return removed ? { ok: true, data: input } : { ok: false, error: "This prerequisite could not be found." };
}
