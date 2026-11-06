"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/form-feedback";
import type { FormAction, FormResult } from "@/lib/forms/action-state";

type Result = FormResult<"id", { id: string }>;

export function FinishReminderForm({ action, reminderId, goalTitle }: {
  action: FormAction<"id", { id: string }>;
  reminderId: string;
  goalTitle: string;
}) {
  const [state, formAction, pending] = useActionState<Result | null, FormData>(action, null);
  return (
    <form action={formAction} aria-label={`Finish review of ${goalTitle}`} className="shrink-0 space-y-2">
      <input type="hidden" name="id" value={reminderId} />
      <Button type="submit" variant="outline" size="sm" disabled={pending} aria-busy={pending}>{pending ? "Saving…" : "Finish review"}</Button>
      {state?.ok === false && <FormFeedback state={state} success="" />}
    </form>
  );
}
