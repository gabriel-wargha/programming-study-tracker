"use server";

import { addConfidenceRating } from "@/features/confidence/mutations";
import { confidenceRatingSchema, type ConfidenceField } from "@/features/confidence/schemas";
import { requireScope } from "@/lib/auth/scope";
import type { FormResult } from "@/lib/forms/action-state";
import { invalidInput } from "@/lib/forms/invalid-input";
import { revalidateStudyData } from "@/lib/revalidate-study-data";

type Result = FormResult<ConfidenceField, { rating: number }>;

export async function addConfidenceRatingAction(_previous: Result | null, formData: FormData): Promise<Result> {
  const scope = await requireScope();
  const parsed = confidenceRatingSchema.safeParse({ topicId: formData.get("topicId"), rating: formData.get("rating") });
  if (!parsed.success) return invalidInput<ConfidenceField>(parsed.error);

  const result = await addConfidenceRating(scope, parsed.data);
  if (result.ok) revalidateStudyData();
  return result;
}
