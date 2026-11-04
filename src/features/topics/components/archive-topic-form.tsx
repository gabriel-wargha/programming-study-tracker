"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ActiveGoalList, FormFeedback } from "@/components/form-feedback";
import { archiveTopicSchema } from "@/features/topics/schemas";
import type { ActiveGoalLink, FormAction, FormResult } from "@/lib/forms/action-state";

export function ArchiveTopicForm({ action, topicId, activeGoals }: {
  action: FormAction<"id", { id: string }>;
  topicId: string;
  activeGoals: ActiveGoalLink[];
}) {
  const blocked = activeGoals.length > 0;
  const [state, formAction, pending] = useActionState<FormResult<"id", { id: string }> | null, FormData>(async (previous, formData) => {
    if (!archiveTopicSchema.safeParse({ id: formData.get("id") }).success) return { ok: false, error: "Choose a valid topic." };
    if (blocked) return { ok: false, error: "A topic with active goals cannot be archived.", activeGoals };
    return action(previous, formData);
  }, null);
  return (
    <form action={formAction} aria-label="Archive topic" className="space-y-3">
      <input type="hidden" name="id" value={topicId} />
      {blocked && <div><p className="text-sm text-muted-foreground">Move these active goals to planned or complete them before archiving this topic.</p><ActiveGoalList goals={activeGoals} /></div>}
      <FormFeedback state={state} success="Topic archived." />
      <Button type="submit" variant="outline" disabled={pending || blocked} aria-busy={pending}>{pending ? "Archiving…" : "Archive topic"}</Button>
    </form>
  );
}
