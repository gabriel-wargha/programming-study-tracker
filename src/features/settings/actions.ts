"use server";

import { updateActiveGoalLimit } from "@/features/settings/mutations";
import { activeGoalLimitSchema } from "@/features/settings/schemas";
import { requireScope } from "@/lib/auth/scope";
import type { FormResult } from "@/lib/forms/action-state";
import { invalidInput } from "@/lib/forms/invalid-input";
import { revalidateStudyData } from "@/lib/revalidate-study-data";

type LimitResult = FormResult<"activeGoalLimit", { activeGoalLimit: number }>;

export async function updateActiveGoalLimitAction(_previous: LimitResult | null, formData: FormData): Promise<LimitResult> {
  const scope = await requireScope();
  const parsed = activeGoalLimitSchema.safeParse({ activeGoalLimit: formData.get("activeGoalLimit") });
  if (!parsed.success) return invalidInput<"activeGoalLimit">(parsed.error);

  const result = await updateActiveGoalLimit(scope, parsed.data.activeGoalLimit);
  if (result.ok) revalidateStudyData();
  return result;
}
