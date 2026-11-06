"use client";

import { useState } from "react";
import { ConfidenceForm } from "@/features/confidence/components/confidence-form";
import type { ConfidenceField } from "@/features/confidence/schemas";
import type { FormAction } from "@/lib/forms/action-state";

/** Shown after completing a goal. The owner can rate the topic or skip. */
export function CompletionRatingPrompt({ action, topicId, topicName }: {
  action: FormAction<ConfidenceField, { rating: number }>;
  topicId: string;
  topicName: string;
}) {
  const [skipped, setSkipped] = useState(false);
  if (skipped) return null;
  return (
    <div className="mt-4 rounded-md border bg-subtle p-4">
      <ConfidenceForm action={action} topicId={topicId} legend={`Goal complete. How confident are you in ${topicName} now?`} onSkip={() => setSkipped(true)} />
    </div>
  );
}
