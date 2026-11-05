"use client";

import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { FieldError, FormFeedback } from "@/components/form-feedback";
import {
  editProjectSchema, projectSchema, readProjectForm, type ProjectField, type ProjectFormValues,
} from "@/features/projects/schemas";
import type { FormAction, FormResult } from "@/lib/forms/action-state";
import { fieldErrors } from "@/lib/forms/field-errors";

type Result = FormResult<ProjectField, { id: string }>;

export function ProjectForm({ action, initialValues }: {
  action: FormAction<ProjectField, { id: string }>;
  initialValues?: ProjectFormValues;
}) {
  const id = useId();
  const [values, setValues] = useState<ProjectFormValues>(initialValues ?? { title: "", repoUrl: "", liveUrl: "", description: "" });
  const editing = Boolean(initialValues?.id);
  const update = (field: keyof ProjectFormValues, value: string) => setValues((previous) => ({ ...previous, [field]: value }));
  const [state, formAction, pending] = useActionState<Result | null, FormData>(async (previous, formData) => {
    const input = readProjectForm(formData);
    const parsed = editing ? editProjectSchema.safeParse({ ...input, id: formData.get("id") }) : projectSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    return action(previous, formData);
  }, null);
  const errors = state?.ok === false ? state.fieldErrors : undefined;
  const describedBy = (field: ProjectField, hint?: string) =>
    [hint, errors?.[field] ? `${id}-${field}-error` : undefined].filter(Boolean).join(" ") || undefined;

  return (
    <form action={formAction} noValidate aria-label={editing ? "Edit project" : "Create project"} className="space-y-5">
      {editing && <input type="hidden" name="id" value={initialValues?.id} />}
      <fieldset disabled={pending} className="space-y-5">
        <div>
          <label htmlFor={`${id}-title`} className="text-sm font-medium">Project title</label>
          <Input id={`${id}-title`} name="title" required maxLength={160} value={values.title} onChange={(event) => update("title", event.target.value)}
            className="mt-2" aria-invalid={Boolean(errors?.title)} aria-describedby={describedBy("title")} />
          <FieldError id={`${id}-title-error`} errors={errors?.title} />
        </div>
        <div>
          <label htmlFor={`${id}-repo`} className="text-sm font-medium">Repository URL</label>
          <p id={`${id}-repo-hint`} className="mt-1 text-sm text-muted-foreground">Any Git host, starting with https://</p>
          <Input id={`${id}-repo`} name="repoUrl" type="url" inputMode="url" required maxLength={2048} placeholder="https://github.com/you/project"
            value={values.repoUrl} onChange={(event) => update("repoUrl", event.target.value)}
            className="mt-2" aria-invalid={Boolean(errors?.repoUrl)} aria-describedby={describedBy("repoUrl", `${id}-repo-hint`)} />
          <FieldError id={`${id}-repoUrl-error`} errors={errors?.repoUrl} />
        </div>
        <div>
          <label htmlFor={`${id}-live`} className="text-sm font-medium">Live site URL <span className="font-normal text-muted-foreground">(optional)</span></label>
          <Input id={`${id}-live`} name="liveUrl" type="url" inputMode="url" maxLength={2048} value={values.liveUrl} onChange={(event) => update("liveUrl", event.target.value)}
            className="mt-2" aria-invalid={Boolean(errors?.liveUrl)} aria-describedby={describedBy("liveUrl")} />
          <FieldError id={`${id}-liveUrl-error`} errors={errors?.liveUrl} />
        </div>
        <div>
          <label htmlFor={`${id}-description`} className="text-sm font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span></label>
          <Textarea id={`${id}-description`} name="description" maxLength={5000} value={values.description} onChange={(event) => update("description", event.target.value)}
            className="mt-2" aria-invalid={Boolean(errors?.description)} aria-describedby={describedBy("description")} />
          <FieldError id={`${id}-description-error`} errors={errors?.description} />
        </div>
      </fieldset>
      <FormFeedback state={state} success="Project saved." />
      <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : editing ? "Save project" : "Create project"}</Button>
    </form>
  );
}
