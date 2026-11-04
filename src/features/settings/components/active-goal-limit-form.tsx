"use client";

import { useActionState, useId, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, FormFeedback } from "@/components/form-feedback";
import { activeGoalLimitSchema } from "@/features/settings/schemas";
import type { ActiveGoalLink, FormAction, FormResult } from "@/lib/forms/action-state";

export function ActiveGoalLimitForm({ action, activeGoalLimit, activeGoals }: {
  action: FormAction<"activeGoalLimit", { activeGoalLimit: number }>;
  activeGoalLimit: number;
  activeGoals: ActiveGoalLink[];
}) {
  const id = useId();
  const [value, setValue] = useState(String(activeGoalLimit));
  const [state, formAction, pending] = useActionState<FormResult<"activeGoalLimit", { activeGoalLimit: number }> | null, FormData>(async (previous, formData) => {
    const parsed = activeGoalLimitSchema.safeParse({ activeGoalLimit: formData.get("activeGoalLimit") });
    if (!parsed.success) return { ok: false, error: "Check the highlighted field.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
    if (parsed.data.activeGoalLimit < activeGoals.length) {
      return { ok: false, error: "Move active goals to planned before lowering this limit.", activeGoals };
    }
    return action(previous, formData);
  }, null);
  const errors = state?.ok === false ? state.fieldErrors : undefined;
  return (
    <form action={formAction} noValidate aria-label="Active goal limit" className="space-y-5">
      <div>
        <label htmlFor={`${id}-limit`} className="text-sm font-medium">Maximum active goals</label>
        <p id={`${id}-hint`} className="mt-1 text-sm leading-6 text-muted-foreground">Choose 1 to 10. You currently have {activeGoals.length} active {activeGoals.length === 1 ? "goal" : "goals"}.</p>
        <Input id={`${id}-limit`} type="number" name="activeGoalLimit" min={1} max={10} step={1} required
          value={value} onChange={(event) => setValue(event.target.value)} disabled={pending}
          className="mt-2 max-w-28" aria-invalid={Boolean(errors?.activeGoalLimit)}
          aria-describedby={`${id}-hint${errors?.activeGoalLimit ? ` ${id}-error` : ""}`} />
        <FieldError id={`${id}-error`} errors={errors?.activeGoalLimit} />
      </div>
      <FormFeedback state={state} success="Active goal limit saved." />
      <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : "Save limit"}</Button>
    </form>
  );
}
