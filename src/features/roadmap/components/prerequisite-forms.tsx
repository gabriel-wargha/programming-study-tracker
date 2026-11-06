"use client";

import { useActionState, useId, useState } from "react";
import { X } from "lucide-react";
import { keepValuesOnReset } from "@/lib/forms/keep-values-on-reset";
import { Button } from "@/components/ui/button";
import { inputClassName } from "@/components/ui/input";
import { FieldError, FormFeedback } from "@/components/form-feedback";
import type { RoadmapTopic } from "@/features/roadmap/order";
import type { PrerequisiteField } from "@/features/roadmap/schemas";
import type { FormAction, FormResult } from "@/lib/forms/action-state";

type Input = { topicId: string; prerequisiteTopicId: string };
type Result = FormResult<PrerequisiteField, Input>;

export function AddPrerequisiteForm({ action, topic, options }: { action: FormAction<PrerequisiteField, Input>; topic: RoadmapTopic; options: RoadmapTopic[] }) {
  const id = useId();
  const [choice, setChoice] = useState("");
  const [state, formAction, pending] = useActionState<Result | null, FormData>(async (previous, formData) => {
    if (!formData.get("prerequisiteTopicId")) {
      return { ok: false, error: "Check the highlighted fields.", fieldErrors: { prerequisiteTopicId: ["Choose a topic."] } };
    }
    const result = await action(previous, formData);
    if (result.ok) setChoice("");
    return result;
  }, null);
  const errors = state?.ok === false ? state.fieldErrors : undefined;
  return (
    <form action={formAction} onReset={keepValuesOnReset} noValidate aria-label={`Add a prerequisite to ${topic.name}`} className="space-y-2">
      <input type="hidden" name="topicId" value={topic.id} />
      <label htmlFor={`${id}-topic`} className="text-sm font-medium">Learn first</label>
      <div className="flex flex-wrap gap-2">
        <select id={`${id}-topic`} name="prerequisiteTopicId" value={choice} onChange={(event) => setChoice(event.target.value)} disabled={pending} className={`${inputClassName} min-h-10 min-w-0 flex-1 basis-40`}
          aria-invalid={Boolean(errors?.prerequisiteTopicId)} aria-describedby={errors?.prerequisiteTopicId ? `${id}-error` : undefined}>
          <option value="">Choose a topic</option>
          {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
        <Button type="submit" variant="outline" size="sm" disabled={pending} aria-busy={pending}>{pending ? "Adding…" : "Add"}</Button>
      </div>
      <FieldError id={`${id}-error`} errors={errors?.prerequisiteTopicId} />
      {state?.ok === false && !errors && <FormFeedback state={state} success="" />}
    </form>
  );
}

export function RemovePrerequisiteForm({ action, topic, prerequisite }: { action: FormAction<PrerequisiteField, Input>; topic: RoadmapTopic; prerequisite: RoadmapTopic }) {
  const [state, formAction, pending] = useActionState<Result | null, FormData>(action, null);
  return (
    <form action={formAction} aria-label={`Remove ${prerequisite.name} from ${topic.name}`}>
      <input type="hidden" name="topicId" value={topic.id} />
      <input type="hidden" name="prerequisiteTopicId" value={prerequisite.id} />
      <Button type="submit" variant="ghost" disabled={pending} aria-busy={pending} aria-label={`Remove ${prerequisite.name} as a prerequisite of ${topic.name}`}
        className="size-8 p-0 text-muted-foreground hover:text-destructive"><X aria-hidden="true" /></Button>
      {state?.ok === false && <FormFeedback state={state} success="" />}
    </form>
  );
}
