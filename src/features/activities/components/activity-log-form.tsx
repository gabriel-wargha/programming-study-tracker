"use client";

import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, inputClassName } from "@/components/ui/input";
import { FieldError, FormFeedback } from "@/components/form-feedback";
import {
  NEW_PROJECT, activityTypeLabels, activityTypes, logActivitiesSchema, readLogForm,
  type ActivityType, type LogField,
} from "@/features/activities/schemas";
import { activityTypeColors } from "@/features/activities/components/activity-type-tag";
import type { ProjectOption } from "@/features/projects/schemas";
import { cn } from "@/lib/utils";
import { useLocalToday } from "@/lib/dates/use-local-today";
import type { FormAction, FormResult } from "@/lib/forms/action-state";
import { fieldErrors } from "@/lib/forms/field-errors";

type Result = FormResult<LogField, { goalId: string; count: number }>;
type EntryValues = { description: string; minutes: string };
type NewProjectValues = { projectTitle: string; projectRepoUrl: string; projectLiveUrl: string; projectDescription: string };

const emptyEntries = Object.fromEntries(activityTypes.map((type) => [type, { description: "", minutes: "" }])) as Record<ActivityType, EntryValues>;
const futureDate = "The date can't be in the future.";

export function ActivityLogForm({ action, goalId, projects }: {
  action: FormAction<LogField, { goalId: string; count: number }>;
  goalId: string;
  projects: ProjectOption[];
}) {
  const id = useId();
  const today = useLocalToday();
  const [date, setDate] = useState<string | null>(null);
  const [selected, setSelected] = useState<ActivityType[]>([]);
  const [entries, setEntries] = useState(emptyEntries);
  const [projectId, setProjectId] = useState(projects.length ? "" : NEW_PROJECT);
  const [newProject, setNewProject] = useState<NewProjectValues>({ projectTitle: "", projectRepoUrl: "", projectLiveUrl: "", projectDescription: "" });

  const [state, formAction, pending] = useActionState<Result | null, FormData>(async (previous, formData) => {
    const parsed = logActivitiesSchema.safeParse(readLogForm(formData));
    if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
    // The server only knows the date can't be later than anywhere on Earth; the browser knows the owner's own date.
    if (today && parsed.data.occurredOn > today) {
      return { ok: false, error: "Check the highlighted fields.", fieldErrors: { occurredOn: [futureDate] } };
    }
    return action(previous, formData);
  }, null);

  const errors = state?.ok === false ? state.fieldErrors : undefined;
  const errorId = (field: LogField) => `${id}-${field}-error`;
  const describedBy = (field: LogField, hint?: string) =>
    [hint, errors?.[field] ? errorId(field) : undefined].filter(Boolean).join(" ") || undefined;
  const toggle = (type: ActivityType, checked: boolean) =>
    setSelected((previous) => checked ? activityTypes.filter((item) => item === type || previous.includes(item)) : previous.filter((item) => item !== type));
  const updateEntry = (type: ActivityType, field: keyof EntryValues, value: string) =>
    setEntries((previous) => ({ ...previous, [type]: { ...previous[type], [field]: value } }));
  const updateProject = (field: keyof NewProjectValues, value: string) =>
    setNewProject((previous) => ({ ...previous, [field]: value }));

  return (
    <form action={formAction} noValidate aria-label="Log activities" className="space-y-6">
      <input type="hidden" name="goalId" value={goalId} />
      <fieldset disabled={pending} className="space-y-6">
        <div>
          <label htmlFor={`${id}-date`} className="block text-sm font-semibold">Date</label>
          <p id={`${id}-date-hint`} className="mt-1 text-sm text-muted-foreground">Weeks run Monday to Sunday. Future dates aren&apos;t allowed.</p>
          <Input id={`${id}-date`} name="occurredOn" type="date" required max={today ?? undefined}
            value={date ?? today ?? ""} onChange={(event) => setDate(event.target.value)}
            className="mt-2 max-w-xs" aria-invalid={Boolean(errors?.occurredOn)} aria-describedby={describedBy("occurredOn", `${id}-date-hint`)} />
          <FieldError id={errorId("occurredOn")} errors={errors?.occurredOn} />
        </div>

        <fieldset aria-describedby={describedBy("types", `${id}-types-hint`)}>
          <legend className="text-sm font-semibold">What did you do?</legend>
          <p id={`${id}-types-hint`} className="mt-1 text-sm text-muted-foreground">Choose everything that applies. Each choice is saved as its own activity.</p>
          <FieldError id={errorId("types")} errors={errors?.types} />
          <ul className="mt-3 space-y-2">
            {activityTypes.map((type) => {
              const checked = selected.includes(type);
              const labelId = `${id}-${type}-label`;
              const descriptionField = `description-${type}` as const;
              const minutesField = `minutes-${type}` as const;
              return (
                <li key={type} className={cn("rounded-lg border bg-card px-4 transition-colors", checked ? "border-primary/50 py-3 shadow-[0_0_0_3px_var(--secondary)]" : "py-1 hover:bg-subtle")}>
                  <div className="flex min-h-11 items-center gap-3">
                    <input id={`${id}-${type}`} type="checkbox" name="types" value={type} checked={checked}
                      onChange={(event) => toggle(type, event.target.checked)} className="size-5 shrink-0 accent-primary" />
                    <label id={labelId} htmlFor={`${id}-${type}`} className="flex flex-1 cursor-pointer items-center gap-2 py-2 text-sm font-medium">
                      <span aria-hidden="true" className={cn("h-4 w-1 rounded-full", activityTypeColors[type].bar)} />
                      {activityTypeLabels[type]}
                    </label>
                  </div>
                  {checked && (
                    <div role="group" aria-labelledby={labelId} className="mt-3 grid gap-4 sm:grid-cols-[1fr_9rem]">
                      <div>
                        <label htmlFor={`${id}-${type}-description`} className="text-sm font-medium">Description</label>
                        <Textarea id={`${id}-${type}-description`} name={descriptionField} required maxLength={2000} rows={3}
                          value={entries[type].description} onChange={(event) => updateEntry(type, "description", event.target.value)}
                          className="mt-2 min-h-20" aria-invalid={Boolean(errors?.[descriptionField])} aria-describedby={describedBy(descriptionField)} />
                        <FieldError id={errorId(descriptionField)} errors={errors?.[descriptionField]} />
                      </div>
                      <div>
                        <label htmlFor={`${id}-${type}-minutes`} className="text-sm font-medium">Minutes <span className="font-normal text-muted-foreground">(optional)</span></label>
                        <Input id={`${id}-${type}-minutes`} name={minutesField} type="number" inputMode="numeric" min={1} max={1440} step={1}
                          value={entries[type].minutes} onChange={(event) => updateEntry(type, "minutes", event.target.value)}
                          className="mt-2" aria-invalid={Boolean(errors?.[minutesField])} aria-describedby={describedBy(minutesField)} />
                        <FieldError id={errorId(minutesField)} errors={errors?.[minutesField]} />
                      </div>
                      {type === "project" && (
                        <ProjectChoice
                          id={id} projects={projects} projectId={projectId} onProjectIdChange={setProjectId}
                          values={newProject} onChange={updateProject} errors={errors} describedBy={describedBy}
                        />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </fieldset>
      </fieldset>
      <FormFeedback state={state} success="Log saved." />
      <Button type="submit" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : "Save log"}</Button>
    </form>
  );
}

function ProjectChoice({ id, projects, projectId, onProjectIdChange, values, onChange, errors, describedBy }: {
  id: string;
  projects: ProjectOption[];
  projectId: string;
  onProjectIdChange: (value: string) => void;
  values: NewProjectValues;
  onChange: (field: keyof NewProjectValues, value: string) => void;
  errors?: Partial<Record<LogField, string[]>>;
  describedBy: (field: LogField, hint?: string) => string | undefined;
}) {
  const field = (name: keyof NewProjectValues, label: string, options: { optional?: boolean; hint?: string; url?: boolean; multiline?: boolean } = {}) => {
    const inputId = `${id}-${name}`;
    const hintId = options.hint ? `${inputId}-hint` : undefined;
    const props = {
      id: inputId, name, value: values[name], className: "mt-2",
      "aria-invalid": Boolean(errors?.[name]), "aria-describedby": describedBy(name, hintId),
    };
    return (
      <div>
        <label htmlFor={inputId} className="text-sm font-medium">
          {label}{options.optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
        </label>
        {options.hint && <p id={hintId} className="mt-1 text-sm text-muted-foreground">{options.hint}</p>}
        {options.multiline
          ? <Textarea {...props} maxLength={5000} rows={3} className="mt-2 min-h-20" onChange={(event) => onChange(name, event.target.value)} />
          : <Input {...props} required={!options.optional} type={options.url ? "url" : "text"} inputMode={options.url ? "url" : undefined}
              maxLength={options.url ? 2048 : 160} onChange={(event) => onChange(name, event.target.value)} />}
        <FieldError id={`${id}-${name}-error`} errors={errors?.[name]} />
      </div>
    );
  };

  return (
    <fieldset className="space-y-4 border-t pt-4 sm:col-span-2">
      <legend className="sr-only">Project</legend>
      <div>
        <label htmlFor={`${id}-projectId`} className="text-sm font-medium">Project</label>
        <select id={`${id}-projectId`} name="projectId" value={projectId} onChange={(event) => onProjectIdChange(event.target.value)}
          className={`${inputClassName} mt-2 min-h-11`} aria-invalid={Boolean(errors?.projectId)} aria-describedby={describedBy("projectId")}>
          {projects.length > 0 && <option value="">Choose a project</option>}
          {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
          <option value={NEW_PROJECT}>Add a new project</option>
        </select>
        <FieldError id={`${id}-projectId-error`} errors={errors?.projectId} />
      </div>
      {projectId === NEW_PROJECT && (
        <div className="grid gap-4">
          {field("projectTitle", "Project title")}
          {field("projectRepoUrl", "Repository URL", { url: true, hint: "Any Git host, starting with https://" })}
          {field("projectLiveUrl", "Live site URL", { url: true, optional: true })}
          {field("projectDescription", "Project description", { optional: true, multiline: true })}
        </div>
      )}
    </fieldset>
  );
}
