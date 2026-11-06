"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/form-feedback";
import type { FormAction, FormResult } from "@/lib/forms/action-state";

type Result = FormResult<"id", { id: string }>;

/** Deleting takes two steps: Delete, then Confirm delete. */
export function DeleteForm({ action, id, name, noun }: {
  action: FormAction<"id", { id: string }>;
  id: string;
  /** Names this item for screen readers, such as "Took a course on Nov 3". */
  name: string;
  noun: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<Result | null, FormData>(action, null);

  if (!confirming) {
    return (
      <Button type="button" variant="ghost" onClick={() => setConfirming(true)} aria-label={`Delete ${name}`}
        className="h-9 gap-1.5 px-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
        <Trash2 aria-hidden="true" className="size-3.5" />Delete
      </Button>
    );
  }
  return (
    <form action={formAction} aria-label={`Delete ${name}`} className="flex w-full flex-wrap items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm">Delete this {noun}? This can&apos;t be undone.</p>
      <Button type="submit" variant="destructive" size="sm" disabled={pending} aria-busy={pending}>{pending ? "Deleting…" : "Confirm delete"}</Button>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setConfirming(false)}>Cancel</Button>
      <div className="basis-full empty:hidden"><FormFeedback state={state} success={`${noun[0].toUpperCase()}${noun.slice(1)} deleted.`} /></div>
    </form>
  );
}
