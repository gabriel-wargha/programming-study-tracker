"use server";

import { addPrerequisite, removePrerequisite } from "@/features/roadmap/mutations";
import { prerequisiteSchema, type PrerequisiteField } from "@/features/roadmap/schemas";
import { requireScope } from "@/lib/auth/scope";
import type { FormResult } from "@/lib/forms/action-state";
import { invalidInput } from "@/lib/forms/invalid-input";
import { revalidateStudyData } from "@/lib/revalidate-study-data";

type Input = { topicId: string; prerequisiteTopicId: string };
type Result = FormResult<PrerequisiteField, Input>;

const read = (formData: FormData) => ({ topicId: formData.get("topicId"), prerequisiteTopicId: formData.get("prerequisiteTopicId") });

export async function addPrerequisiteAction(_previous: Result | null, formData: FormData): Promise<Result> {
  const scope = await requireScope();
  const parsed = prerequisiteSchema.safeParse(read(formData));
  if (!parsed.success) return invalidInput<PrerequisiteField>(parsed.error);
  const result = await addPrerequisite(scope, parsed.data);
  if (result.ok) revalidateStudyData();
  return result;
}

export async function removePrerequisiteAction(_previous: Result | null, formData: FormData): Promise<Result> {
  const scope = await requireScope();
  const parsed = prerequisiteSchema.safeParse(read(formData));
  if (!parsed.success) return invalidInput<PrerequisiteField>(parsed.error);
  const result = await removePrerequisite(scope, parsed.data);
  if (result.ok) revalidateStudyData();
  return result;
}
