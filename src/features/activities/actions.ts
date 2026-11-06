"use server";

import { redirect } from "next/navigation";
import { deleteActivity, logActivities, updateActivity } from "@/features/activities/mutations";
import {
  deleteActivitySchema, editActivitySchema, logActivitiesSchema, readActivityForm, readLogForm,
  type ActivityField, type LogField,
} from "@/features/activities/schemas";
import { syncProjectGitHub } from "@/features/projects/mutations";
import { requireScope } from "@/lib/auth/scope";
import type { FormResult } from "@/lib/forms/action-state";
import { invalidInput } from "@/lib/forms/invalid-input";
import { revalidateStudyData } from "@/lib/revalidate-study-data";

type LogResult = FormResult<LogField, { goalId: string; count: number; newProjectId?: string }>;
type ActivityResult = FormResult<ActivityField, { id: string }>;

export async function logActivitiesAction(_previous: LogResult | null, formData: FormData): Promise<LogResult> {
  const scope = await requireScope();
  const parsed = logActivitiesSchema.safeParse(readLogForm(formData));
  if (!parsed.success) return invalidInput<LogField>(parsed.error);

  const result = await logActivities(scope, parsed.data);
  if (!result.ok) return result;
  // The log is already saved. The project page explains any GitHub problem and offers Refresh.
  if (result.data.newProjectId) await syncProjectGitHub(scope, result.data.newProjectId);
  revalidateStudyData();
  redirect(`/goals/${result.data.goalId}?logged=${result.data.count}#activity-history`);
}

export async function updateActivityAction(_previous: ActivityResult | null, formData: FormData): Promise<ActivityResult> {
  const scope = await requireScope();
  const parsed = editActivitySchema.safeParse(readActivityForm(formData));
  if (!parsed.success) return invalidInput<ActivityField>(parsed.error);

  const { id, ...input } = parsed.data;
  const result = await updateActivity(scope, id, input);
  if (result.ok) revalidateStudyData();
  return result;
}

export async function deleteActivityAction(
  _previous: FormResult<"id", { id: string }> | null,
  formData: FormData,
): Promise<FormResult<"id", { id: string }>> {
  const scope = await requireScope();
  const parsed = deleteActivitySchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Choose a valid activity." };

  const result = await deleteActivity(scope, parsed.data.id);
  if (result.ok) revalidateStudyData();
  return result;
}
