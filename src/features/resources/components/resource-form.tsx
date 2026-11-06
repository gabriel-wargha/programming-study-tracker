"use client";

import { useActionState, useId, useState } from "react";
import { keepValuesOnReset } from "@/lib/forms/keep-values-on-reset";
import { Button } from "@/components/ui/button";
import { Input, inputClassName } from "@/components/ui/input";
import { FieldError, FormFeedback } from "@/components/form-feedback";
import {
  createResourceSchema, editResourceSchema, readResourceForm, resourceStatusLabels, resourceStatuses, resourceTypeLabels, resourceTypes,
  type ResourceField, type ResourceItem,
} from "@/features/resources/schemas";
import type { FormAction, FormResult } from "@/lib/forms/action-state";
import { fieldErrors } from "@/lib/forms/field-errors";

type Result = FormResult<ResourceField, { id: string }>;

/** Adds a resource when given `topicId`, or edits `resource`. */
export function ResourceForm({ action, topicId, resource }: {
  action: FormAction<ResourceField, { id: string }>;
  topicId?: string;
  resource?: ResourceItem;
}) {
  const id = useId();
  const empty = { title: "", url: "", type: "docs", status: "to_do" };
  // Controlled, because React resets uncontrolled fields after every form action.
  const [values, setValues] = useState(resource ? { ...resource, url: resource.url ?? "" } : empty);
  const update = (field: keyof typeof empty, value: string) => setValues((previous) => ({ ...previous, [field]: value }));
  const [state, formAction, pending] = useActionState<Result | null, FormData>(async (previous, formData) => {
    const input = readResourceForm(formData);
    const parsed = resource
      ? editResourceSchema.safeParse({ ...input, id: formData.get("id") })
      : createResourceSchema.safeParse({ ...input, topicId: formData.get("topicId") });
    if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    const result = await action(previous, formData);
    if (result.ok && !resource) setValues(empty);
    return result;
  }, null);
  const errors = state?.ok === false ? state.fieldErrors : undefined;
  const describedBy = (field: ResourceField) => (errors?.[field] ? `${id}-${field}-error` : undefined);

  return (
    <form action={formAction} onReset={keepValuesOnReset} noValidate aria-label={resource ? "Edit resource" : "Add resource"} className="space-y-4">
      {resource ? <input type="hidden" name="id" value={resource.id} /> : <input type="hidden" name="topicId" value={topicId} />}
      <fieldset disabled={pending} className="grid gap-4">
        <div>
          <label htmlFor={`${id}-title`} className="text-sm font-medium">Resource title</label>
          <Input id={`${id}-title`} name="title" required maxLength={200} value={values.title} onChange={(event) => update("title", event.target.value)} className="mt-2"
            aria-invalid={Boolean(errors?.title)} aria-describedby={describedBy("title")} />
          <FieldError id={`${id}-title-error`} errors={errors?.title} />
        </div>
        <div>
          <label htmlFor={`${id}-url`} className="text-sm font-medium">URL <span className="font-normal text-muted-foreground">(optional)</span></label>
          <Input id={`${id}-url`} name="url" type="url" inputMode="url" maxLength={2048} value={values.url} onChange={(event) => update("url", event.target.value)} className="mt-2"
            aria-invalid={Boolean(errors?.url)} aria-describedby={describedBy("url")} />
          <FieldError id={`${id}-url-error`} errors={errors?.url} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-type`} className="text-sm font-medium">Type</label>
            <select id={`${id}-type`} name="type" value={values.type} onChange={(event) => update("type", event.target.value)} className={`${inputClassName} mt-2 min-h-11`}>
              {resourceTypes.map((type) => <option key={type} value={type}>{resourceTypeLabels[type]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-status`} className="text-sm font-medium">Status</label>
            <select id={`${id}-status`} name="status" value={values.status} onChange={(event) => update("status", event.target.value)} className={`${inputClassName} mt-2 min-h-11`}>
              {resourceStatuses.map((status) => <option key={status} value={status}>{resourceStatusLabels[status]}</option>)}
            </select>
          </div>
        </div>
      </fieldset>
      <FormFeedback state={state} success={resource ? "Resource saved." : "Resource added."} />
      <Button type="submit" size="sm" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : resource ? "Save resource" : "Add resource"}</Button>
    </form>
  );
}
