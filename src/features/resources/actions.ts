"use server";

import { createResource, deleteResource, updateResource } from "@/features/resources/mutations";
import {
  createResourceSchema, deleteResourceSchema, editResourceSchema, readResourceForm, type ResourceField,
} from "@/features/resources/schemas";
import { requireScope } from "@/lib/auth/scope";
import type { FormResult } from "@/lib/forms/action-state";
import { invalidInput } from "@/lib/forms/invalid-input";
import { revalidateStudyData } from "@/lib/revalidate-study-data";

type Result = FormResult<ResourceField, { id: string }>;

export async function createResourceAction(_previous: Result | null, formData: FormData): Promise<Result> {
  const scope = await requireScope();
  const parsed = createResourceSchema.safeParse({ ...readResourceForm(formData), topicId: formData.get("topicId") });
  if (!parsed.success) return invalidInput<ResourceField>(parsed.error);
  const { topicId, ...input } = parsed.data;
  const result = await createResource(scope, topicId, input);
  if (result.ok) revalidateStudyData();
  return result;
}

export async function updateResourceAction(_previous: Result | null, formData: FormData): Promise<Result> {
  const scope = await requireScope();
  const parsed = editResourceSchema.safeParse({ ...readResourceForm(formData), id: formData.get("id") });
  if (!parsed.success) return invalidInput<ResourceField>(parsed.error);
  const { id, ...input } = parsed.data;
  const result = await updateResource(scope, id, input);
  if (result.ok) revalidateStudyData();
  return result;
}

export async function deleteResourceAction(
  _previous: FormResult<"id", { id: string }> | null,
  formData: FormData,
): Promise<FormResult<"id", { id: string }>> {
  const scope = await requireScope();
  const parsed = deleteResourceSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Choose a valid resource." };
  const result = await deleteResource(scope, parsed.data.id);
  if (result.ok) revalidateStudyData();
  return result;
}
