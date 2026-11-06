"use client";

import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { FieldError, FormFeedback } from "@/components/form-feedback";
import { createBlockerSchema, solveBlockerSchema, type BlockerField, type SolveField } from "@/features/blockers/schemas";
import type { FormAction, FormResult } from "@/lib/forms/action-state";
import { fieldErrors } from "@/lib/forms/field-errors";

export function AddBlockerForm({ action, goalId }: { action: FormAction<BlockerField, { id: string }>; goalId: string }) {
  const id = useId();
  // Controlled, because React resets uncontrolled fields after every form action.
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [state, formAction, pending] = useActionState<FormResult<BlockerField, { id: string }> | null, FormData>(async (previous, formData) => {
    const parsed = createBlockerSchema.safeParse({ goalId: formData.get("goalId"), title: formData.get("title"), details: formData.get("details") ?? "" });
    if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const result = await action(previous, formData);
    if (result.ok) { setTitle(""); setDetails(""); }
    return result;
  }, null);
  const errors = state?.ok === false ? state.fieldErrors : undefined;
  return (
    <form action={formAction} noValidate aria-label="Add blocker" className="space-y-4">
      <input type="hidden" name="goalId" value={goalId} />
      <fieldset disabled={pending} className="grid gap-4">
        <div>
          <label htmlFor={`${id}-title`} className="text-sm font-medium">What&apos;s blocking you?</label>
          <Input id={`${id}-title`} name="title" required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2" aria-invalid={Boolean(errors?.title)} aria-describedby={errors?.title ? `${id}-title-error` : undefined} />
          <FieldError id={`${id}-title-error`} errors={errors?.title} />
        </div>
        <div>
          <label htmlFor={`${id}-details`} className="text-sm font-medium">Details <span className="font-normal text-muted-foreground">(optional)</span></label>
          <Textarea id={`${id}-details`} name="details" maxLength={5000} rows={3} value={details} onChange={(event) => setDetails(event.target.value)} className="mt-2 min-h-20" aria-invalid={Boolean(errors?.details)} aria-describedby={errors?.details ? `${id}-details-error` : undefined} />
          <FieldError id={`${id}-details-error`} errors={errors?.details} />
        </div>
      </fieldset>
      <FormFeedback state={state} success="Blocker added." />
      <Button type="submit" size="sm" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : "Add blocker"}</Button>
    </form>
  );
}

/** A blocker needs a solution before it can be marked as solved. */
export function SolveBlockerForm({ action, blockerId, blockerTitle, initialSolution = "" }: {
  action: FormAction<SolveField, { id: string }>;
  blockerId: string;
  blockerTitle: string;
  initialSolution?: string;
}) {
  const id = useId();
  const [solution, setSolution] = useState(initialSolution);
  const [state, formAction, pending] = useActionState<FormResult<SolveField, { id: string }> | null, FormData>(async (previous, formData) => {
    const parsed = solveBlockerSchema.safeParse({ id: formData.get("id"), solution: formData.get("solution") });
    if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    return action(previous, formData);
  }, null);
  const errors = state?.ok === false ? state.fieldErrors : undefined;
  return (
    <form action={formAction} noValidate aria-label={`Solve ${blockerTitle}`} className="space-y-3">
      <input type="hidden" name="id" value={blockerId} />
      <fieldset disabled={pending}>
        <label htmlFor={`${id}-solution`} className="text-sm font-medium">How did you solve it?</label>
        <Textarea id={`${id}-solution`} name="solution" required maxLength={5000} rows={3} value={solution} onChange={(event) => setSolution(event.target.value)} className="mt-2 min-h-20"
          aria-invalid={Boolean(errors?.solution)} aria-describedby={errors?.solution ? `${id}-solution-error` : undefined} />
        <FieldError id={`${id}-solution-error`} errors={errors?.solution} />
      </fieldset>
      <FormFeedback state={state} success="Blocker solved." />
      <Button type="submit" size="sm" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : "Mark as solved"}</Button>
    </form>
  );
}

export function ReopenBlockerForm({ action, blockerId, blockerTitle }: {
  action: FormAction<"id", { id: string }>;
  blockerId: string;
  blockerTitle: string;
}) {
  const [state, formAction, pending] = useActionState<FormResult<"id", { id: string }> | null, FormData>(action, null);
  return (
    <form action={formAction} aria-label={`Reopen ${blockerTitle}`} className="space-y-2">
      <input type="hidden" name="id" value={blockerId} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending} aria-busy={pending} className="text-muted-foreground">{pending ? "Reopening…" : "Reopen"}</Button>
      {state?.ok === false && <FormFeedback state={state} success="" />}
    </form>
  );
}
