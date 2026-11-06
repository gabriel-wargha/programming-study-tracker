import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/page-header";
import { ActivityTypeTag } from "@/features/activities/components/activity-type-tag";
import type { DashboardGoal } from "@/features/dashboard/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";
import { formatMinutes } from "@/lib/dates/format-minutes";

export function ActiveGoalProgress({ goals, activeGoalLimit }: { goals: DashboardGoal[]; activeGoalLimit: number }) {
  return (
    <section aria-labelledby="active-goals-heading">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="active-goals-heading" className="text-lg font-semibold">Active goals</h2>
        <p className="text-sm text-muted-foreground">
          {goals.length} of {activeGoalLimit} active goal slots in use
        </p>
      </div>
      {goals.length ? (
        <ul aria-label="Active goals" className="divide-y rounded-lg border bg-card">
          {goals.map((goal) => (
            <li key={goal.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0 space-y-2">
                <div>
                  <h3 className="font-semibold wrap-break-word">
                    <Link href={`/goals/${goal.id}`} className="rounded-sm hover:text-primary hover:underline">{goal.title}</Link>
                  </h3>
                  <p className="text-xs text-muted-foreground">{goal.topicName}</p>
                </div>
                {goal.latestActivity ? (
                  <div className="space-y-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      <span className="text-muted-foreground">Latest:</span>
                      <ActivityTypeTag type={goal.latestActivity.type} />
                      <span className="text-muted-foreground">on</span>
                      <time dateTime={goal.latestActivity.occurredOn} className="text-muted-foreground tabular-nums">{formatCalendarDate(goal.latestActivity.occurredOn)}</time>
                    </p>
                    <p className="line-clamp-2 max-w-[60ch] text-sm leading-relaxed wrap-break-word text-muted-foreground">{goal.latestActivity.description}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No activity logged yet.</p>
                )}
                <p className="text-sm">
                  <span className="text-muted-foreground">This week:</span>{" "}
                  {goal.weekActivityCount
                    ? <span className="font-medium tabular-nums">{goal.weekActivityCount === 1 ? "1 activity" : `${goal.weekActivityCount} activities`}{goal.weekMinutes ? `, ${formatMinutes(goal.weekMinutes)}` : ""}</span>
                    : "nothing logged yet"}
                </p>
              </div>
              <Button asChild variant={goal.weekActivityCount ? "outline" : "default"} className="shrink-0 self-start">
                <Link href={`/goals/${goal.id}/log`} aria-label={`Log this week: ${goal.title}`}>Log this week</Link>
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No active goals yet" headingLevel={3}>
          <p>Make a goal active to log what you do each week.</p>
          <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/goals/new" className="font-medium text-primary underline underline-offset-4">Create a goal</Link>
            <Link href="/goals?status=planned" className="font-medium text-primary underline underline-offset-4">See planned goals</Link>
          </p>
        </EmptyState>
      )}
    </section>
  );
}
