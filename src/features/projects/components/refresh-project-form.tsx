"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormFeedback } from "@/components/form-feedback";
import type { FormAction, FormResult } from "@/lib/forms/action-state";

type Result = FormResult<"id", { id: string }>;

export function RefreshProjectForm({ action, projectId }: { action: FormAction<"id", { id: string }>; projectId: string }) {
  const [state, formAction, pending] = useActionState<Result | null, FormData>(action, null);
  return (
    <form action={formAction} aria-label="Refresh GitHub details" className="space-y-3">
      <input type="hidden" name="id" value={projectId} />
      <FormFeedback state={state} success="GitHub details updated." />
      <Button type="submit" variant="outline" size="sm" disabled={pending} aria-busy={pending}>
        <RefreshCw aria-hidden="true" />{pending ? "Refreshing…" : "Refresh"}
      </Button>
    </form>
  );
}
