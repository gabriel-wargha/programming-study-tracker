"use server";

import { updatePortfolioSettings } from "@/features/portfolio/mutations";
import { portfolioSettingsSchema, readPortfolioForm, type PortfolioField } from "@/features/portfolio/schemas";
import { requireScope } from "@/lib/auth/scope";
import type { FormResult } from "@/lib/forms/action-state";
import { invalidInput } from "@/lib/forms/invalid-input";
import { revalidateStudyData } from "@/lib/revalidate-study-data";

type Result = FormResult<PortfolioField, { slug: string | null }>;

export async function updatePortfolioAction(_previous: Result | null, formData: FormData): Promise<Result> {
  const scope = await requireScope();
  const parsed = portfolioSettingsSchema.safeParse(readPortfolioForm(formData));
  if (!parsed.success) return invalidInput<PortfolioField>(parsed.error);

  const result = await updatePortfolioSettings(scope, parsed.data);
  if (result.ok) revalidateStudyData();
  return result;
}
