"use client";

import { useActionState } from "react";
import { Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/form-feedback";
import type { FormAction, FormResult } from "@/lib/forms/action-state";

type Result = FormResult<"id", { isPublic: boolean }>;

/** Goals and projects are private until the owner marks them public. */
export function PublicToggleForm({ action, id, isPublic, noun }: {
  action: FormAction<"id", { isPublic: boolean }>;
  id: string;
  isPublic: boolean;
  noun: "goal" | "project";
}) {
  const [state, formAction, pending] = useActionState<Result | null, FormData>(action, null);
  return (
    <form action={formAction} aria-label="Portfolio visibility" className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="isPublic" value={String(!isPublic)} />
      <p className="flex items-start gap-2 text-sm">
        {isPublic ? <Globe aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" /> : <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
        <span>{isPublic ? `This ${noun} appears on your portfolio.` : `This ${noun} is private.`}</span>
      </p>
      {state?.ok === false && <FormFeedback state={state} success="" />}
      <Button type="submit" variant="outline" size="sm" disabled={pending} aria-busy={pending}>
        {pending ? "Saving…" : isPublic ? "Make private" : "Show on portfolio"}
      </Button>
    </form>
  );
}
