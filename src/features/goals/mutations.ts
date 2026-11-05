import "server-only";

import { and, eq } from "drizzle-orm";
import { goals } from "@/db/schema";
import { listActiveGoals } from "@/features/goals/queries";
import type { GoalField, GoalStatus, GoalStatusField } from "@/features/goals/schemas";
import type { UserScope } from "@/lib/auth/scope";
import { databaseErrorCode, postgresErrorCodes, ruleErrorCodes } from "@/lib/db/errors";
import type { FormResult } from "@/lib/forms/action-state";

type GoalInput = {
  topicId: string;
  title: string;
  description: string | null;
  definitionOfDone: string;
  targetDate: string | null;
};

const limitReached = "Your active goal limit is reached. Move a goal to planned first.";

async function goalRuleFailure<Field extends string, Data>(
  scope: UserScope,
  error: unknown,
  topicField: Field | null,
): Promise<FormResult<Field, Data>> {
  const topicError = (message: string): FormResult<Field, Data> => topicField
    ? { ok: false, error: "Check the highlighted fields.", fieldErrors: { [topicField]: [message] } as Partial<Record<Field, string[]>> }
    : { ok: false, error: message };
  switch (databaseErrorCode(error)) {
    case ruleErrorCodes.activeGoalLimitReached:
      return { ok: false, error: limitReached, activeGoals: await listActiveGoals(scope) };
    case ruleErrorCodes.archivedTopic:
      return topicError("This topic is archived. Choose an open topic.");
    case ruleErrorCodes.invalidStatusChange:
      return { ok: false, error: "That goal status change is not available." };
    case postgresErrorCodes.foreignKeyViolation:
      return topicError("Choose one of your topics.");
    default:
      throw error;
  }
}

export async function createGoal(
  scope: UserScope,
  input: GoalInput & { status: "planned" | "active" },
): Promise<FormResult<GoalField, { id: string }>> {
  try {
    const [goal] = await scope.db.insert(goals).values({ userId: scope.userId, ...input })
      .returning({ id: goals.id });
    return { ok: true, data: goal };
  } catch (error) {
    return goalRuleFailure(scope, error, "topicId");
  }
}

export async function updateGoal(
  scope: UserScope,
  id: string,
  input: GoalInput,
): Promise<FormResult<GoalField, { id: string }>> {
  try {
    const [goal] = await scope.db.update(goals).set(input)
      .where(and(eq(goals.id, id), eq(goals.userId, scope.userId))).returning({ id: goals.id });
    return goal ? { ok: true, data: goal } : { ok: false, error: "This goal could not be found." };
  } catch (error) {
    return goalRuleFailure(scope, error, "topicId");
  }
}

export async function changeGoalStatus(
  scope: UserScope,
  id: string,
  status: GoalStatus,
): Promise<FormResult<GoalStatusField, { status: GoalStatus }>> {
  try {
    const [goal] = await scope.db.update(goals).set({ status })
      .where(and(eq(goals.id, id), eq(goals.userId, scope.userId))).returning({ status: goals.status });
    return goal ? { ok: true, data: goal } : { ok: false, error: "This goal could not be found." };
  } catch (error) {
    if (databaseErrorCode(error) === ruleErrorCodes.archivedTopic) {
      return { ok: false, error: "A goal in an archived topic cannot become active." };
    }
    return goalRuleFailure(scope, error, null);
  }
}
