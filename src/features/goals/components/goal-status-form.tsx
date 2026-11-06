"use client";

import { useActionState, useId, useState, type ReactNode } from "react";
import { z } from "zod";
import { keepValuesOnReset } from "@/lib/forms/keep-values-on-reset";
import { Button } from "@/components/ui/button";
import { inputClassName } from "@/components/ui/input";
import { FieldError, FormFeedback } from "@/components/form-feedback";
import { assessGoalTransition, goalStatusLabels, goalTransitions } from "@/features/goals/rules";
import { changeGoalStatusSchema, type GoalStatus, type GoalStatusField } from "@/features/goals/schemas";
import type { ActiveGoalLink, FormAction, FormResult } from "@/lib/forms/action-state";

export function GoalStatusForm({ action, goalId, currentStatus, activeGoals, activeGoalLimit, topicArchived = false, completionPrompt }: {
  action: FormAction<GoalStatusField, { status: GoalStatus }>;
  goalId: string;
  currentStatus: GoalStatus;
  activeGoals: ActiveGoalLink[];
  activeGoalLimit: number;
  topicArchived?: boolean;
  /** Shown right after this form completes the goal. */
  completionPrompt?: ReactNode;
}) {
  const id = useId();
  const [status, setStatus] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [state, formAction, pending] = useActionState<FormResult<GoalStatusField, { status: GoalStatus }> | null, FormData>(async (previous, formData) => {
    const parsed = changeGoalStatusSchema.safeParse({
      id: formData.get("id"), status: formData.get("status"), confirmed: formData.get("confirmed") === "on",
    });
    if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
    const allowed = assessGoalTransition({ from: currentStatus, to: parsed.data.status, activeCount: activeGoals.length, limit: activeGoalLimit, topicArchived, confirmed: parsed.data.confirmed });
    if (!allowed.ok) return { ok: false, error: allowed.error, ...(parsed.data.status === "active" ? { activeGoals } : {}) };
    const result = await action(previous, formData);
    // The available options change with the new status, so clear the old choice.
    if (result.ok) { setStatus(""); setConfirmed(false); }
    return result;
  }, null);
  const errors = state?.ok === false ? state.fieldErrors : undefined;
  const justCompleted = state?.ok === true && state.data.status === "completed";
  if (currentStatus === "archived") return <p className="text-sm text-muted-foreground">This goal is archived.</p>;

  return (
    <>
    <form action={formAction} onReset={keepValuesOnReset} noValidate aria-label="Change goal status" className="space-y-4">
      <input type="hidden" name="id" value={goalId} />
      <fieldset disabled={pending} className="space-y-4">
        <div>
          <label htmlFor={`${id}-status`} className="text-sm font-medium">Move goal to</label>
          <select id={`${id}-status`} name="status" required value={status} onChange={(event) => { setStatus(event.target.value); setConfirmed(false); }}
            className={`${inputClassName} mt-2 min-h-11`} aria-invalid={Boolean(errors?.status)} aria-describedby={errors?.status ? `${id}-status-error` : undefined}>
            <option value="">Choose a status</option>
            {goalTransitions[currentStatus].map((value) => <option key={value} value={value}>{goalStatusLabels[value]}</option>)}
          </select>
          <FieldError id={`${id}-status-error`} errors={errors?.status} />
        </div>
        {status === "completed" && <div>
          <label className="flex items-start gap-3 text-sm leading-6">
            <input name="confirmed" type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1 size-4 accent-primary" aria-invalid={Boolean(errors?.confirmed)} aria-describedby={errors?.confirmed ? `${id}-confirmed-error` : undefined} />
            I&apos;ve met the definition of done.
          </label>
          <FieldError id={`${id}-confirmed-error`} errors={errors?.confirmed} />
        </div>}
      </fieldset>
      <FormFeedback state={state} success="Goal status updated." />
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Updating…" : status === "completed" ? "Complete goal" : "Update status"}
      </Button>
    </form>
    {justCompleted && completionPrompt}
    </>
  );
}
