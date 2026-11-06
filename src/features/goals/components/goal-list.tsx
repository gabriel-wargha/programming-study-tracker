import Link from "next/link";
import { EmptyState } from "@/components/page-header";
import { GoalStatusBadge } from "@/features/goals/components/goal-status-badge";
import type { GoalStatus, GoalSummary } from "@/features/goals/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";

export function GoalList({ goals, status = "all" }: { goals: GoalSummary[]; status?: GoalStatus | "all" }) {
  const visible = status === "all" ? goals : goals.filter((goal) => goal.status === status);
  if (!visible.length) {
    return (
      <EmptyState title={status === "all" ? "No goals yet" : `No ${status} goals`}>
        <p>Give your next goal a clear definition of done.</p>
      </EmptyState>
    );
  }
  return (
    <ul aria-label="Goals" className="divide-y rounded-lg border bg-card">
      {visible.map((goal) => (
        <li key={goal.id} className="relative px-5 py-4 hover:bg-subtle">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <h2 className="font-semibold wrap-break-word">
                <Link href={`/goals/${goal.id}`} className="rounded-sm hover:text-primary hover:underline">{goal.title}</Link>
              </h2>
              <p className="text-xs text-muted-foreground">{goal.topicName}</p>
            </div>
            <GoalStatusBadge status={goal.status} />
          </div>
          <p className="mt-2 line-clamp-2 max-w-[70ch] text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-muted-foreground">{goal.definitionOfDone}</p>
          {goal.targetDate && <p className="mt-2 text-xs text-muted-foreground">Target <time dateTime={goal.targetDate} className="tabular-nums">{formatCalendarDate(goal.targetDate)}</time></p>}
        </li>
      ))}
    </ul>
  );
}
