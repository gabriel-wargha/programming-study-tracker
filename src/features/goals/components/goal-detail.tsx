import type { ReactNode } from "react";
import Link from "next/link";
import { goalStatusLabels } from "@/features/goals/rules";
import type { GoalSummary } from "@/features/goals/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";

export function GoalDetail({ goal, children }: { goal: GoalSummary; children?: ReactNode }) {
  return (
    <article className="space-y-8">
      <header>
        <Link href={`/topics/${goal.topicId}`} className="text-sm text-primary underline underline-offset-4">{goal.topicName}</Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4"><h1 className="text-3xl font-semibold tracking-tight wrap-break-word">{goal.title}</h1><span className="rounded-full border px-3 py-1 text-sm">{goalStatusLabels[goal.status]}</span></div>
        {goal.targetDate && <p className="mt-3 text-sm text-muted-foreground">Target: <time dateTime={goal.targetDate}>{formatCalendarDate(goal.targetDate)}</time></p>}
      </header>
      <section aria-labelledby="definition-of-done" className="rounded-xl border bg-card p-6">
        <h2 id="definition-of-done" className="font-semibold">Definition of done</h2>
        <p className="mt-3 leading-7 whitespace-pre-wrap wrap-break-word">{goal.definitionOfDone}</p>
      </section>
      {goal.description && <section aria-labelledby="goal-description"><h2 id="goal-description" className="font-semibold">About this goal</h2><p className="mt-3 leading-7 whitespace-pre-wrap wrap-break-word text-muted-foreground">{goal.description}</p></section>}
      {children}
    </article>
  );
}
