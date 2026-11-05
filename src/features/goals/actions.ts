"use server";

import { redirect } from "next/navigation";
import { changeGoalStatus, createGoal, updateGoal } from "@/features/goals/mutations";
import {
  changeGoalStatusSchema, createGoalSchema, editGoalSchema,
  type GoalField, type GoalStatus, type GoalStatusField,
} from "@/features/goals/schemas";
import { requireScope } from "@/lib/auth/scope";
import type { FormResult } from "@/lib/forms/action-state";
import { invalidInput } from "@/lib/forms/invalid-input";
import { revalidateStudyData } from "@/lib/revalidate-study-data";

type GoalResult = FormResult<GoalField, { id: string }>;
type StatusResult = FormResult<GoalStatusField, { status: GoalStatus }>;

const goalFields = (formData: FormData) => ({
  topicId: formData.get("topicId"),
  title: formData.get("title"),
  description: formData.get("description") ?? "",
  definitionOfDone: formData.get("definitionOfDone"),
  targetDate: formData.get("targetDate") ?? "",
});

export async function createGoalAction(_previous: GoalResult | null, formData: FormData): Promise<GoalResult> {
  const scope = await requireScope();
  const parsed = createGoalSchema.safeParse({ ...goalFields(formData), status: formData.get("status") });
  if (!parsed.success) return invalidInput<GoalField>(parsed.error);

  const result = await createGoal(scope, parsed.data);
  if (!result.ok) return result;
  revalidateStudyData();
  redirect(`/goals/${result.data.id}`);
}

export async function updateGoalAction(_previous: GoalResult | null, formData: FormData): Promise<GoalResult> {
  const scope = await requireScope();
  const parsed = editGoalSchema.safeParse({ ...goalFields(formData), id: formData.get("id") });
  if (!parsed.success) return invalidInput<GoalField>(parsed.error);

  const { id, ...input } = parsed.data;
  const result = await updateGoal(scope, id, input);
  if (result.ok) revalidateStudyData();
  return result;
}

export async function changeGoalStatusAction(_previous: StatusResult | null, formData: FormData): Promise<StatusResult> {
  const scope = await requireScope();
  const parsed = changeGoalStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    confirmed: formData.get("confirmed") === "on",
  });
  if (!parsed.success) return invalidInput<GoalStatusField>(parsed.error);

  const result = await changeGoalStatus(scope, parsed.data.id, parsed.data.status);
  if (result.ok) revalidateStudyData();
  return result;
}
