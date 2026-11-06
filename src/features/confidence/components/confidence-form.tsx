"use client";

import { useActionState, useId, useState } from "react";
import { keepValuesOnReset } from "@/lib/forms/keep-values-on-reset";
import { Button } from "@/components/ui/button";
import { FieldError, FormFeedback } from "@/components/form-feedback";
import { confidenceLabels, confidenceRatingSchema, type ConfidenceField } from "@/features/confidence/schemas";
import type { FormAction, FormResult } from "@/lib/forms/action-state";
import { fieldErrors } from "@/lib/forms/field-errors";

type Result = FormResult<ConfidenceField, { rating: number }>;

export function ConfidenceForm({ action, topicId, legend = "How confident are you now?", onSkip }: {
  action: FormAction<ConfidenceField, { rating: number }>;
  topicId: string;
  legend?: string;
  onSkip?: () => void;
}) {
  const id = useId();
  const [choice, setChoice] = useState("");
  const [state, formAction, pending] = useActionState<Result | null, FormData>(async (previous, formData) => {
    const parsed = confidenceRatingSchema.safeParse({ topicId: formData.get("topicId"), rating: formData.get("rating") });
    if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const result = await action(previous, formData);
    if (result.ok) setChoice("");
    return result;
  }, null);
  const errors = state?.ok === false ? state.fieldErrors : undefined;

  return (
    <form action={formAction} onReset={keepValuesOnReset} noValidate aria-label="Rate your confidence" className="space-y-3">
      <input type="hidden" name="topicId" value={topicId} />
      <fieldset disabled={pending} aria-describedby={errors?.rating ? `${id}-error` : undefined}>
        <legend className="text-sm font-medium">{legend}</legend>
        <div className="mt-2 grid gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <label key={rating} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2 text-sm hover:bg-muted has-checked:bg-secondary">
              <input type="radio" name="rating" value={rating} checked={choice === String(rating)} onChange={(event) => setChoice(event.target.value)} className="size-4 accent-primary" />
              <span className="font-medium tabular-nums">{rating}</span>
              <span className="text-muted-foreground">{confidenceLabels[rating]}</span>
            </label>
          ))}
        </div>
        <FieldError id={`${id}-error`} errors={errors?.rating} />
      </fieldset>
      <FormFeedback state={state} success="Rating saved." />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : "Save rating"}</Button>
        {onSkip && <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={onSkip}>Skip</Button>}
      </div>
    </form>
  );
}
