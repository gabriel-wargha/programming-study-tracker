"use server";

import { redirect } from "next/navigation";
import { createProject, syncProjectGitHub, updateProject } from "@/features/projects/mutations";
import {
  editProjectSchema, gitHubSyncMessages, projectSchema, readProjectForm, refreshProjectSchema, type ProjectField,
} from "@/features/projects/schemas";
import { requireScope } from "@/lib/auth/scope";
import type { FormResult } from "@/lib/forms/action-state";
import { invalidInput } from "@/lib/forms/invalid-input";
import { revalidateStudyData } from "@/lib/revalidate-study-data";

type ProjectResult = FormResult<ProjectField, { id: string; githubWarning?: string }>;

export async function createProjectAction(_previous: ProjectResult | null, formData: FormData): Promise<ProjectResult> {
  const scope = await requireScope();
  const parsed = projectSchema.safeParse(readProjectForm(formData));
  if (!parsed.success) return invalidInput<ProjectField>(parsed.error);

  const result = await createProject(scope, parsed.data);
  if (!result.ok) return result;
  const sync = await syncProjectGitHub(scope, result.data.id);
  revalidateStudyData();
  redirect(`/projects/${result.data.id}${sync.ok || sync.reason === "missing_project" ? "" : `?github=${sync.reason}`}`);
}

export async function updateProjectAction(_previous: ProjectResult | null, formData: FormData): Promise<ProjectResult> {
  const scope = await requireScope();
  const parsed = editProjectSchema.safeParse({ ...readProjectForm(formData), id: formData.get("id") });
  if (!parsed.success) return invalidInput<ProjectField>(parsed.error);

  const { id, ...input } = parsed.data;
  const result = await updateProject(scope, id, input);
  if (!result.ok) return result;
  const sync = await syncProjectGitHub(scope, id);
  revalidateStudyData();
  return sync.ok || sync.reason === "missing_project"
    ? result
    : { ok: true, data: { ...result.data, githubWarning: gitHubSyncMessages[sync.reason] } };
}

export async function refreshProjectAction(
  _previous: FormResult<"id", { id: string }> | null,
  formData: FormData,
): Promise<FormResult<"id", { id: string }>> {
  const scope = await requireScope();
  const parsed = refreshProjectSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Choose a valid project." };

  const sync = await syncProjectGitHub(scope, parsed.data.id);
  if (!sync.ok) {
    return { ok: false, error: sync.reason === "missing_project" ? "This project could not be found." : gitHubSyncMessages[sync.reason] };
  }
  revalidateStudyData();
  return { ok: true, data: { id: parsed.data.id } };
}
