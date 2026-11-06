import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { GoalStatusBadge } from "@/features/goals/components/goal-status-badge";
import type { GoalSummary } from "@/features/goals/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";

/** The goal page frame: header, the definition of done, then `children` beside an optional `aside`. */
export function GoalDetail({ goal, actions, aside, children }: {
  goal: GoalSummary;
  actions?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article>
      <PageHeader
        back={{ href: `/topics/${goal.topicId}`, label: goal.topicName }}
        title={goal.title}
        actions={actions}
        meta={<>
          <GoalStatusBadge status={goal.status} />
          {goal.targetDate && <span>Target <time dateTime={goal.targetDate} className="tabular-nums">{formatCalendarDate(goal.targetDate)}</time></span>}
        </>}
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="definition-of-done" className="rounded-lg border border-l-4 border-l-primary bg-card px-5 py-4">
            <h2 id="definition-of-done" className="text-sm font-semibold text-muted-foreground">Definition of done</h2>
            <p className="mt-2 max-w-[70ch] text-[0.9375rem] leading-relaxed whitespace-pre-wrap wrap-break-word">{goal.definitionOfDone}</p>
          </section>
          {goal.description && (
            <section aria-labelledby="goal-description">
              <h2 id="goal-description" className="text-sm font-semibold text-muted-foreground">About this goal</h2>
              <p className="mt-2 max-w-[70ch] leading-relaxed whitespace-pre-wrap wrap-break-word">{goal.description}</p>
            </section>
          )}
          {children}
        </div>
        {aside && <aside aria-label="Goal settings" className="space-y-4 lg:sticky lg:top-10 lg:self-start">{aside}</aside>}
      </div>
    </article>
  );
}
