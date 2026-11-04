"use client";

import { useActionState, useId, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { FieldError, FormFeedback } from "@/components/form-feedback";
import { editTopicSchema, topicSchema, type TopicField, type TopicFormValues } from "@/features/topics/schemas";
import type { FormAction, FormResult } from "@/lib/forms/action-state";

export function TopicForm({ action, initialValues }: {
  action: FormAction<TopicField, { id: string }>;
  initialValues?: TopicFormValues;
}) {
  const id = useId();
  const [values, setValues] = useState(initialValues ?? { name: "", description: "" });
  const editing = Boolean(initialValues?.id);
  const [state, formAction, pending] = useActionState<FormResult<TopicField, { id: string }> | null, FormData>(async (previous, formData) => {
    const input = { name: formData.get("name"), description: formData.get("description") ?? "" };
    const parsed = editing ? editTopicSchema.safeParse({ ...input, id: formData.get("id") }) : topicSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
    return action(previous, formData);
  }, null);
  const errors = state?.ok === false ? state.fieldErrors : undefined;

  return (
    <form action={formAction} noValidate aria-label={editing ? "Edit topic" : "Create topic"} className="space-y-5">
      {editing && <input type="hidden" name="id" value={initialValues?.id} />}
      <fieldset disabled={pending} className="space-y-5">
        <div>
          <label htmlFor={`${id}-name`} className="text-sm font-medium">Topic name</label>
          <Input id={`${id}-name`} name="name" required maxLength={100} value={values.name}
            onChange={(event) => setValues({ ...values, name: event.target.value })}
            aria-invalid={Boolean(errors?.name)} aria-describedby={errors?.name ? `${id}-name-error` : undefined} className="mt-2" />
          <FieldError id={`${id}-name-error`} errors={errors?.name} />
        </div>
        <div>
          <label htmlFor={`${id}-description`} className="text-sm font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span></label>
          <Textarea id={`${id}-description`} name="description" maxLength={5000} value={values.description}
            onChange={(event) => setValues({ ...values, description: event.target.value })}
            aria-invalid={Boolean(errors?.description)} aria-describedby={errors?.description ? `${id}-description-error` : undefined} className="mt-2" />
          <FieldError id={`${id}-description-error`} errors={errors?.description} />
        </div>
      </fieldset>
      <FormFeedback state={state} success="Topic saved." />
      <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : editing ? "Save topic" : "Create topic"}</Button>
    </form>
  );
}
