"use client";

import { useActionState, useId, useState } from "react";
import { fieldErrors } from "@/lib/forms/field-errors";
import { keepValuesOnReset } from "@/lib/forms/keep-values-on-reset";
import { Button } from "@/components/ui/button";
import { Input, Textarea, inputClassName } from "@/components/ui/input";
import { ActiveGoalList, FieldError, FormFeedback } from "@/components/form-feedback";
import { createGoalSchema, editGoalSchema, type GoalField, type GoalFormValues, type TopicOption } from "@/features/goals/schemas";
import type { ActiveGoalLink, FormAction, FormResult } from "@/lib/forms/action-state";

export function GoalForm({ action, topics, initialValues, activeGoals, activeGoalLimit }: {
  action: FormAction<GoalField, { id: string }>;
  topics: TopicOption[];
  initialValues?: GoalFormValues;
  activeGoals: ActiveGoalLink[];
  activeGoalLimit: number;
}) {
  const id = useId();
  const [values, setValues] = useState<GoalFormValues>(initialValues ?? {
    topicId: "", title: "", description: "", definitionOfDone: "", targetDate: "",
  });
  const [status, setStatus] = useState("planned");
  const editing = Boolean(initialValues?.id);
  const atLimit = activeGoals.length >= activeGoalLimit;
  const update = (field: keyof GoalFormValues, value: string) => setValues((previous) => ({ ...previous, [field]: value }));
  const [state, formAction, pending] = useActionState<FormResult<GoalField, { id: string }> | null, FormData>(async (previous, formData) => {
    const input = {
      topicId: formData.get("topicId"), title: formData.get("title"),
      description: formData.get("description") ?? "", definitionOfDone: formData.get("definitionOfDone"),
      targetDate: formData.get("targetDate") ?? "",
    };
    const parsed = editing ? editGoalSchema.safeParse({ ...input, id: formData.get("id") }) :
      createGoalSchema.safeParse({ ...input, status: formData.get("status") });
    if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    if (!editing && formData.get("status") === "active" && atLimit) {
      return { ok: false, error: "Your active goal limit is reached. Move a goal to planned first.", activeGoals };
    }
    return action(previous, formData);
  }, null);
  const errors = state?.ok === false ? state.fieldErrors : undefined;
  const disabled = pending || topics.length === 0;

  return (
    <form action={formAction} onReset={keepValuesOnReset} noValidate aria-label={editing ? "Edit goal" : "Create goal"} className="space-y-5">
      {editing && <input type="hidden" name="id" value={initialValues?.id} />}
      {!topics.length && <p role="status" className="rounded-md border p-4 text-sm text-muted-foreground">Create a topic before adding a goal.</p>}
      <fieldset disabled={disabled} className="space-y-5">
        <div>
          <label htmlFor={`${id}-topic`} className="text-sm font-medium">Topic</label>
          <select id={`${id}-topic`} name="topicId" required value={values.topicId} onChange={(event) => update("topicId", event.target.value)}
            className={`${inputClassName} mt-2 min-h-11`} aria-invalid={Boolean(errors?.topicId)} aria-describedby={errors?.topicId ? `${id}-topic-error` : undefined}>
            <option value="">Choose a topic</option>
            {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
          </select>
          <FieldError id={`${id}-topic-error`} errors={errors?.topicId} />
        </div>
        <div>
          <label htmlFor={`${id}-title`} className="text-sm font-medium">Goal title</label>
          <Input id={`${id}-title`} name="title" required maxLength={160} value={values.title} onChange={(event) => update("title", event.target.value)}
            className="mt-2" aria-invalid={Boolean(errors?.title)} aria-describedby={errors?.title ? `${id}-title-error` : undefined} />
          <FieldError id={`${id}-title-error`} errors={errors?.title} />
        </div>
        <div>
          <label htmlFor={`${id}-done`} className="text-sm font-medium">Definition of done</label>
          <p id={`${id}-done-hint`} className="mt-1 text-sm text-muted-foreground">Describe the result that will make this goal complete.</p>
          <Textarea id={`${id}-done`} name="definitionOfDone" required maxLength={2000} value={values.definitionOfDone} onChange={(event) => update("definitionOfDone", event.target.value)}
            className="mt-2" aria-invalid={Boolean(errors?.definitionOfDone)} aria-describedby={`${id}-done-hint${errors?.definitionOfDone ? ` ${id}-done-error` : ""}`} />
          <FieldError id={`${id}-done-error`} errors={errors?.definitionOfDone} />
        </div>
        <div>
          <label htmlFor={`${id}-description`} className="text-sm font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span></label>
          <Textarea id={`${id}-description`} name="description" maxLength={5000} value={values.description} onChange={(event) => update("description", event.target.value)}
            className="mt-2" aria-invalid={Boolean(errors?.description)} aria-describedby={errors?.description ? `${id}-description-error` : undefined} />
          <FieldError id={`${id}-description-error`} errors={errors?.description} />
        </div>
        <div>
          <label htmlFor={`${id}-date`} className="block text-sm font-medium">Target date <span className="font-normal text-muted-foreground">(optional)</span></label>
          <Input id={`${id}-date`} name="targetDate" type="date" value={values.targetDate} onChange={(event) => update("targetDate", event.target.value)}
            className="mt-2 max-w-xs" aria-invalid={Boolean(errors?.targetDate)} aria-describedby={errors?.targetDate ? `${id}-date-error` : undefined} />
          <FieldError id={`${id}-date-error`} errors={errors?.targetDate} />
        </div>
        {!editing && <div>
          <label htmlFor={`${id}-status`} className="text-sm font-medium">Starting status</label>
          <select id={`${id}-status`} name="status" value={status} onChange={(event) => setStatus(event.target.value)} className={`${inputClassName} mt-2 min-h-11`}
            aria-invalid={Boolean(errors?.status)} aria-describedby={errors?.status ? `${id}-status-error` : undefined}>
            <option value="planned">Planned</option><option value="active" disabled={atLimit}>Active</option>
          </select>
          <FieldError id={`${id}-status-error`} errors={errors?.status} />
          <p className="mt-2 text-sm text-muted-foreground">{activeGoals.length} of {activeGoalLimit} active goal slots in use.</p>
          {atLimit && <div className="mt-2"><p className="text-sm text-muted-foreground">Your limit is reached. You can still save a planned goal.</p><ActiveGoalList goals={activeGoals} /></div>}
        </div>}
      </fieldset>
      <FormFeedback state={state} success="Goal saved." />
      <Button type="submit" disabled={disabled} aria-busy={pending}>{pending ? "Saving…" : editing ? "Save goal" : "Create goal"}</Button>
    </form>
  );
}
