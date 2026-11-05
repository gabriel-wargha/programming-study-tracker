"use server";

import { redirect } from "next/navigation";
import { createProject, updateProject } from "@/features/projects/mutations";
import { editProjectSchema, projectSchema, readProjectForm, type ProjectField } from "@/features/projects/schemas";
import { requireScope } from "@/lib/auth/scope";
import type { FormResult } from "@/lib/forms/action-state";
import { invalidInput } from "@/lib/forms/invalid-input";
import { revalidateStudyData } from "@/lib/revalidate-study-data";

type ProjectResult = FormResult<ProjectField, { id: string }>;

export async function createProjectAction(_previous: ProjectResult | null, formData: FormData): Promise<ProjectResult> {
  const scope = await requireScope();
  const parsed = projectSchema.safeParse(readProjectForm(formData));
  if (!parsed.success) return invalidInput<ProjectField>(parsed.error);

  const result = await createProject(scope, parsed.data);
  if (!result.ok) return result;
  revalidateStudyData();
  redirect(`/projects/${result.data.id}`);
}

export async function updateProjectAction(_previous: ProjectResult | null, formData: FormData): Promise<ProjectResult> {
  const scope = await requireScope();
  const parsed = editProjectSchema.safeParse({ ...readProjectForm(formData), id: formData.get("id") });
  if (!parsed.success) return invalidInput<ProjectField>(parsed.error);

  const { id, ...input } = parsed.data;
  const result = await updateProject(scope, id, input);
  if (result.ok) revalidateStudyData();
  return result;
}
