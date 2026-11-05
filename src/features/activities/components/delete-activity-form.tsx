"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/form-feedback";
import { deleteActivitySchema } from "@/features/activities/schemas";
import type { FormAction, FormResult } from "@/lib/forms/action-state";

type Result = FormResult<"id", { id: string }>;

/** Deleting takes two steps: Delete, then Confirm delete. */
export function DeleteActivityForm({ action, activityId, activityName }: {
  action: FormAction<"id", { id: string }>;
  activityId: string;
  activityName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<Result | null, FormData>(async (previous, formData) => {
    if (!deleteActivitySchema.safeParse({ id: formData.get("id") }).success) return { ok: false, error: "Choose a valid activity." };
    return action(previous, formData);
  }, null);

  if (!confirming) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(true)} aria-label={`Delete ${activityName}`}>
        Delete
      </Button>
    );
  }
  return (
    <form action={formAction} aria-label={`Delete ${activityName}`} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={activityId} />
      <p className="text-sm">Delete this activity? This can&apos;t be undone.</p>
      <Button type="submit" variant="destructive" size="sm" disabled={pending} aria-busy={pending}>{pending ? "Deleting…" : "Confirm delete"}</Button>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setConfirming(false)}>Cancel</Button>
      <div className="basis-full"><FormFeedback state={state} success="Activity deleted." /></div>
    </form>
  );
}
