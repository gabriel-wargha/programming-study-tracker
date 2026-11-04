import Link from "next/link";
import { goalStatusLabels } from "@/features/goals/rules";
import type { GoalStatus, GoalSummary } from "@/features/goals/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";

export function GoalList({ goals, status = "all" }: { goals: GoalSummary[]; status?: GoalStatus | "all" }) {
  const visible = status === "all" ? goals : goals.filter((goal) => goal.status === status);
  if (!visible.length) return <div className="rounded-xl border border-dashed p-8"><h2 className="font-semibold">{status === "all" ? "No goals yet" : `No ${status} goals`}</h2><p className="mt-2 text-sm text-muted-foreground">Give your next goal a clear definition of done.</p></div>;
  return (
    <ul aria-label="Goals" className="grid gap-4">
      {visible.map((goal) => <li key={goal.id} className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="mb-1 text-xs text-muted-foreground">{goal.topicName}</p><h2 className="font-semibold"><Link href={`/goals/${goal.id}`} className="rounded-sm hover:underline">{goal.title}</Link></h2></div>
          <span className="rounded-full border px-3 py-1 text-xs">{goalStatusLabels[goal.status]}</span>
        </div>
        <p className="mt-3 text-sm leading-6 whitespace-pre-wrap wrap-break-word text-muted-foreground">{goal.definitionOfDone}</p>
        {goal.targetDate && <p className="mt-3 text-xs text-muted-foreground">Target: <time dateTime={goal.targetDate}>{formatCalendarDate(goal.targetDate)}</time></p>}
      </li>)}
    </ul>
  );
}
