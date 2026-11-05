import "server-only";

import { and, eq } from "drizzle-orm";
import { activities, projects } from "@/db/schema";
import type {
  ActivityField, EditActivityInput, LogActivitiesInput, LogField,
} from "@/features/activities/schemas";
import type { UserScope } from "@/lib/auth/scope";
import {
  databaseErrorCode, databaseErrorConstraint, postgresErrorCodes, ruleErrorCodes,
} from "@/lib/db/errors";
import type { FormResult } from "@/lib/forms/action-state";

const futureDate = "The date can't be in the future.";

/** Maps rule failures to readable results; anything unexpected is rethrown. */
function activityFailure<Field extends "occurredOn" | "projectId">(error: unknown): FormResult<Field, never> {
  const fieldError = (field: Field, message: string): FormResult<Field, never> => ({
    ok: false, error: "Check the highlighted fields.", fieldErrors: { [field]: [message] } as Partial<Record<Field, string[]>>,
  });
  switch (databaseErrorCode(error)) {
    case ruleErrorCodes.goalNotActive:
      return { ok: false, error: "Only active goals can receive new activities." };
    case ruleErrorCodes.futureActivityDate:
      return fieldError("occurredOn" as Field, futureDate);
    case postgresErrorCodes.foreignKeyViolation:
      return databaseErrorConstraint(error) === "activities_owned_project_fkey"
        ? fieldError("projectId" as Field, "Choose one of your projects.")
        : { ok: false, error: "This goal could not be found." };
    default:
      throw error;
  }
}

/**
 * Saves one activity per selected type. A new project is saved first, then all
 * activities in one insert; the transaction keeps them together.
 */
export async function logActivities(
  scope: UserScope,
  input: LogActivitiesInput,
): Promise<FormResult<LogField, { goalId: string; count: number }>> {
  try {
    const count = await scope.db.transaction(async (tx) => {
      let projectId: string | null = null;
      if (input.project?.kind === "existing") projectId = input.project.id;
      if (input.project?.kind === "new") {
        const [project] = await tx.insert(projects).values({ userId: scope.userId, ...input.project.project })
          .returning({ id: projects.id });
        projectId = project.id;
      }
      const rows = await tx.insert(activities).values(input.entries.map((entry) => ({
        userId: scope.userId,
        goalId: input.goalId,
        occurredOn: input.occurredOn,
        ...entry,
        projectId: entry.type === "project" ? projectId : null,
      }))).returning({ id: activities.id });
      return rows.length;
    });
    return { ok: true, data: { goalId: input.goalId, count } };
  } catch (error) {
    return activityFailure<"occurredOn" | "projectId">(error);
  }
}

export async function updateActivity(
  { db, userId }: UserScope,
  id: string,
  input: EditActivityInput,
): Promise<FormResult<ActivityField, { id: string }>> {
  try {
    const [activity] = await db.update(activities).set(input)
      .where(and(eq(activities.id, id), eq(activities.userId, userId))).returning({ id: activities.id });
    return activity ? { ok: true, data: activity } : { ok: false, error: "This activity could not be found." };
  } catch (error) {
    return activityFailure<"occurredOn" | "projectId">(error);
  }
}

export async function deleteActivity({ db, userId }: UserScope, id: string): Promise<FormResult<"id", { id: string }>> {
  const [activity] = await db.delete(activities)
    .where(and(eq(activities.id, id), eq(activities.userId, userId))).returning({ id: activities.id });
  return activity ? { ok: true, data: activity } : { ok: false, error: "This activity could not be found." };
}
