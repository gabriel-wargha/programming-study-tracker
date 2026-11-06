"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { keepValuesOnReset } from "@/lib/forms/keep-values-on-reset";
import { Button } from "@/components/ui/button";
import { Input, Textarea, inputClassName } from "@/components/ui/input";
import { FieldError, FormFeedback } from "@/components/form-feedback";
import {
  activityTypeLabels, activityTypes, editActivitySchema, readActivityForm,
  type ActivityField, type ActivityItem,
} from "@/features/activities/schemas";
import type { ProjectOption } from "@/features/projects/schemas";
import type { ResourceOption } from "@/features/resources/schemas";
import { useLocalToday } from "@/lib/dates/use-local-today";
import type { FormAction, FormResult } from "@/lib/forms/action-state";
import { fieldErrors } from "@/lib/forms/field-errors";

type Result = FormResult<ActivityField, { id: string }>;

export function ActivityEditForm({ action, activity, projects, resources = [] }: {
  action: FormAction<ActivityField, { id: string }>;
  activity: ActivityItem;
  projects: ProjectOption[];
  resources?: ResourceOption[];
}) {
  const id = useId();
  const today = useLocalToday();
  const [values, setValues] = useState({
    occurredOn: activity.occurredOn,
    type: activity.type as string,
    description: activity.description,
    minutes: activity.minutes?.toString() ?? "",
    projectId: activity.project?.id ?? "",
    resourceId: activity.resource?.id ?? "",
  });
  const update = (field: keyof typeof values, value: string) => setValues((previous) => ({ ...previous, [field]: value }));
  const [state, formAction, pending] = useActionState<Result | null, FormData>(async (previous, formData) => {
    const parsed = editActivitySchema.safeParse(readActivityForm(formData));
    if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    if (today && parsed.data.occurredOn > today) {
      return { ok: false, error: "Check the highlighted fields.", fieldErrors: { occurredOn: ["The date can't be in the future."] } };
    }
    return action(previous, formData);
  }, null);
  const errors = state?.ok === false ? state.fieldErrors : undefined;
  const describedBy = (field: ActivityField) => (errors?.[field] ? `${id}-${field}-error` : undefined);
  // Keep the activity's current project selectable even if it is the only one.
  const projectOptions = activity.project && !projects.some((project) => project.id === activity.project?.id)
    ? [activity.project, ...projects] : projects;

  return (
    <form action={formAction} onReset={keepValuesOnReset} noValidate aria-label="Edit activity" className="space-y-4">
      <input type="hidden" name="id" value={activity.id} />
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-date`} className="block text-sm font-medium">Date</label>
          <Input id={`${id}-date`} name="occurredOn" type="date" required max={today ?? undefined} value={values.occurredOn}
            onChange={(event) => update("occurredOn", event.target.value)} className="mt-2"
            aria-invalid={Boolean(errors?.occurredOn)} aria-describedby={describedBy("occurredOn")} />
          <FieldError id={`${id}-occurredOn-error`} errors={errors?.occurredOn} />
        </div>
        <div>
          <label htmlFor={`${id}-type`} className="text-sm font-medium">What you did</label>
          <select id={`${id}-type`} name="type" value={values.type} onChange={(event) => update("type", event.target.value)}
            className={`${inputClassName} mt-2 min-h-11`} aria-invalid={Boolean(errors?.type)} aria-describedby={describedBy("type")}>
            {activityTypes.map((type) => <option key={type} value={type}>{activityTypeLabels[type]}</option>)}
          </select>
          <FieldError id={`${id}-type-error`} errors={errors?.type} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-description`} className="text-sm font-medium">Description</label>
          <Textarea id={`${id}-description`} name="description" required maxLength={2000} rows={3} value={values.description}
            onChange={(event) => update("description", event.target.value)} className="mt-2 min-h-20"
            aria-invalid={Boolean(errors?.description)} aria-describedby={describedBy("description")} />
          <FieldError id={`${id}-description-error`} errors={errors?.description} />
        </div>
        <div>
          <label htmlFor={`${id}-minutes`} className="text-sm font-medium">Minutes <span className="font-normal text-muted-foreground">(optional)</span></label>
          <Input id={`${id}-minutes`} name="minutes" type="number" inputMode="numeric" min={1} max={1440} step={1} value={values.minutes}
            onChange={(event) => update("minutes", event.target.value)} className="mt-2"
            aria-invalid={Boolean(errors?.minutes)} aria-describedby={describedBy("minutes")} />
          <FieldError id={`${id}-minutes-error`} errors={errors?.minutes} />
        </div>
        {values.type === "project" && (
          <div>
            <label htmlFor={`${id}-project`} className="text-sm font-medium">Project</label>
            <select id={`${id}-project`} name="projectId" value={values.projectId} onChange={(event) => update("projectId", event.target.value)}
              className={`${inputClassName} mt-2 min-h-11`} aria-invalid={Boolean(errors?.projectId)} aria-describedby={describedBy("projectId")}>
              <option value="">Choose a project</option>
              {projectOptions.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
            </select>
            <FieldError id={`${id}-projectId-error`} errors={errors?.projectId} />
            {!projectOptions.length && <p className="mt-2 text-sm text-muted-foreground"><Link href="/projects" className="text-primary underline underline-offset-4">Add a project</Link> first.</p>}
          </div>
        )}
        {(resources.length > 0 || activity.resource) && (
          <div className="sm:col-span-2">
            <label htmlFor={`${id}-resource`} className="text-sm font-medium">Resource <span className="font-normal text-muted-foreground">(optional)</span></label>
            <select id={`${id}-resource`} name="resourceId" value={values.resourceId} onChange={(event) => update("resourceId", event.target.value)}
              className={`${inputClassName} mt-2 min-h-11`} aria-invalid={Boolean(errors?.resourceId)} aria-describedby={describedBy("resourceId")}>
              <option value="">No resource</option>
              {resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.title}</option>)}
              {activity.resource && !resources.some((resource) => resource.id === activity.resource?.id) && (
                <option value={activity.resource.id}>{activity.resource.title}</option>
              )}
            </select>
            <FieldError id={`${id}-resourceId-error`} errors={errors?.resourceId} />
          </div>
        )}
      </fieldset>
      <FormFeedback state={state} success="Activity saved." />
      <Button type="submit" size="sm" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : "Save activity"}</Button>
    </form>
  );
}
