"use server";

import { createBlocker, reopenBlocker, solveBlocker } from "@/features/blockers/mutations";
import {
  createBlockerSchema, reopenBlockerSchema, solveBlockerSchema, type BlockerField, type SolveField,
} from "@/features/blockers/schemas";
import { requireScope } from "@/lib/auth/scope";
import type { FormResult } from "@/lib/forms/action-state";
import { invalidInput } from "@/lib/forms/invalid-input";
import { revalidateStudyData } from "@/lib/revalidate-study-data";

type CreateResult = FormResult<BlockerField, { id: string }>;
type SolveResult = FormResult<SolveField, { id: string }>;

export async function createBlockerAction(_previous: CreateResult | null, formData: FormData): Promise<CreateResult> {
  const scope = await requireScope();
  const parsed = createBlockerSchema.safeParse({
    goalId: formData.get("goalId"), title: formData.get("title"), details: formData.get("details") ?? "",
  });
  if (!parsed.success) return invalidInput<BlockerField>(parsed.error);
  const result = await createBlocker(scope, parsed.data);
  if (result.ok) revalidateStudyData();
  return result;
}

export async function solveBlockerAction(_previous: SolveResult | null, formData: FormData): Promise<SolveResult> {
  const scope = await requireScope();
  const parsed = solveBlockerSchema.safeParse({ id: formData.get("id"), solution: formData.get("solution") });
  if (!parsed.success) return invalidInput<SolveField>(parsed.error);
  const result = await solveBlocker(scope, parsed.data.id, parsed.data.solution);
  if (result.ok) revalidateStudyData();
  return result;
}

export async function reopenBlockerAction(
  _previous: FormResult<"id", { id: string }> | null,
  formData: FormData,
): Promise<FormResult<"id", { id: string }>> {
  const scope = await requireScope();
  const parsed = reopenBlockerSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Choose a valid blocker." };
  const result = await reopenBlocker(scope, parsed.data.id);
  if (result.ok) revalidateStudyData();
  return result;
}
