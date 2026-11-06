"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
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
      <Button type="button" variant="ghost" onClick={() => setConfirming(true)} aria-label={`Delete ${activityName}`}
        className="h-9 gap-1.5 px-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
        <Trash2 aria-hidden="true" className="size-3.5" />Delete
      </Button>
    );
  }
  return (
    <form action={formAction} aria-label={`Delete ${activityName}`} className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
      <input type="hidden" name="id" value={activityId} />
      <p className="text-sm">Delete this activity? This can&apos;t be undone.</p>
      <Button type="submit" variant="destructive" size="sm" disabled={pending} aria-busy={pending}>{pending ? "Deleting…" : "Confirm delete"}</Button>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setConfirming(false)}>Cancel</Button>
      <div className="basis-full"><FormFeedback state={state} success="Activity deleted." /></div>
    </form>
  );
}
