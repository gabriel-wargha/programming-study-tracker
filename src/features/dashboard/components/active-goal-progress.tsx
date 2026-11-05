import Link from "next/link";
import { activityTypeLabels } from "@/features/activities/schemas";
import type { DashboardGoal } from "@/features/dashboard/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";
import { formatMinutes } from "@/lib/dates/format-minutes";

export function ActiveGoalProgress({ goals, activeGoalLimit }: { goals: DashboardGoal[]; activeGoalLimit: number }) {
  return (
    <section aria-labelledby="active-goals-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="active-goals-heading" className="text-xl font-semibold">Active goals</h2>
        <p className="text-sm text-muted-foreground">{goals.length} of {activeGoalLimit} active goal slots in use</p>
      </div>
      {goals.length ? (
        <ul aria-label="Active goals" className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <li key={goal.id} className="flex flex-col rounded-xl border bg-card p-5">
              <p className="text-xs text-muted-foreground">{goal.topicName}</p>
              <h3 className="mt-1 font-semibold wrap-break-word">
                <Link href={`/goals/${goal.id}`} className="rounded-sm hover:underline">{goal.title}</Link>
              </h3>
              <p className="mt-3 text-sm">
                <span className="font-medium">This week:</span>{" "}
                {goal.weekActivityCount
                  ? `${goal.weekActivityCount === 1 ? "1 activity" : `${goal.weekActivityCount} activities`}${goal.weekMinutes ? `, ${formatMinutes(goal.weekMinutes)}` : ""}`
                  : "nothing logged yet"}
              </p>
              <div className="mt-2 flex-1 text-sm text-muted-foreground">
                {goal.latestActivity ? (
                  <p className="line-clamp-2 wrap-break-word">
                    <span className="text-foreground">Latest:</span> {activityTypeLabels[goal.latestActivity.type]} on{" "}
                    <time dateTime={goal.latestActivity.occurredOn}>{formatCalendarDate(goal.latestActivity.occurredOn)}</time>
                    {" — "}{goal.latestActivity.description}
                  </p>
                ) : (
                  <p>No activity logged yet.</p>
                )}
              </div>
              <Link href={`/goals/${goal.id}/log`} aria-label={`Log this week: ${goal.title}`} className="mt-4 inline-flex min-h-11 w-fit items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none">
                Log this week
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed p-8">
          <h3 className="font-semibold">No active goals yet</h3>
          <p className="mt-2 max-w-prose text-sm leading-6 text-muted-foreground">
            Make a goal active to log what you do each week.
          </p>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/goals/new" className="font-medium text-primary underline underline-offset-4">Create a goal</Link>
            <Link href="/goals?status=planned" className="font-medium text-primary underline underline-offset-4">See planned goals</Link>
          </p>
        </div>
      )}
    </section>
  );
}
