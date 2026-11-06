import Link from "next/link";
import { EmptyState } from "@/components/page-header";
import { ActivityTypeTag } from "@/features/activities/components/activity-type-tag";
import type { ReviewBlocker, WeeklyReview } from "@/features/review/queries";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";
import { formatMinutes } from "@/lib/dates/format-minutes";

function BlockerGroup({ id, title, blockers, empty }: { id: string; title: string; blockers: ReviewBlocker[]; empty: string }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-3 text-lg font-semibold">{title}</h2>
      {blockers.length ? (
        <ul className="divide-y rounded-lg border bg-card">
          {blockers.map((blocker) => (
            <li key={blocker.id} className="px-5 py-3.5">
              <p className="font-medium wrap-break-word">{blocker.title}</p>
              <Link href={`/goals/${blocker.goalId}`} className="text-xs text-muted-foreground hover:text-primary hover:underline">{blocker.goalTitle}</Link>
            </li>
          ))}
        </ul>
      ) : <p className="rounded-lg border border-dashed bg-subtle px-5 py-6 text-sm text-muted-foreground">{empty}</p>}
    </section>
  );
}

export function WeeklyReviewView({ review }: { review: WeeklyReview }) {
  return (
    <div className="space-y-10">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
        <div className="bg-card px-5 py-4">
          <dt className="text-xs text-muted-foreground">Time recorded</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{review.totalMinutes ? formatMinutes(review.totalMinutes) : "0 min"}</dd>
        </div>
        <div className="bg-card px-5 py-4">
          <dt className="text-xs text-muted-foreground">Activities</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{review.activityCount}</dd>
        </div>
      </dl>

      <section aria-labelledby="review-goals" className="space-y-3">
        <h2 id="review-goals" className="text-lg font-semibold">Activities by goal</h2>
        {review.goals.length ? review.goals.map((goal) => (
          <section key={goal.id} aria-labelledby={`review-goal-${goal.id}`} className="overflow-hidden rounded-lg border bg-card">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b bg-subtle px-5 py-3">
              <div className="min-w-0">
                <h3 id={`review-goal-${goal.id}`} className="text-sm font-semibold wrap-break-word">
                  <Link href={`/goals/${goal.id}`} className="hover:text-primary hover:underline">{goal.title}</Link>
                </h3>
                <p className="text-xs text-muted-foreground">{goal.topicName}</p>
              </div>
              <p className="text-xs font-semibold tabular-nums">{goal.totalMinutes ? formatMinutes(goal.totalMinutes) : "No time"} recorded</p>
            </header>
            <ul className="divide-y">
              {goal.activities.map((activity) => (
                <li key={activity.id} className="space-y-1 px-5 py-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <ActivityTypeTag type={activity.type} />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      <time dateTime={activity.occurredOn}>{formatCalendarDate(activity.occurredOn)}</time>
                      {activity.minutes ? ` · ${formatMinutes(activity.minutes)}` : ""}
                    </span>
                  </div>
                  <p className="max-w-[70ch] text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">{activity.description}</p>
                </li>
              ))}
            </ul>
          </section>
        )) : (
          <EmptyState title="Nothing logged this week" headingLevel={3}>
            <p>Activities you log with a date in this week appear here.</p>
          </EmptyState>
        )}
      </section>

      <div className="grid gap-10 md:grid-cols-2">
        <section aria-labelledby="review-projects">
          <h2 id="review-projects" className="mb-3 text-lg font-semibold">Projects worked on</h2>
          {review.projects.length ? (
            <ul className="divide-y rounded-lg border bg-card">
              {review.projects.map((project) => (
                <li key={project.id} className="px-5 py-3.5">
                  <Link href={`/projects/${project.id}`} className="font-medium wrap-break-word hover:text-primary hover:underline">{project.title}</Link>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {project.activityCount === 1 ? "1 activity" : `${project.activityCount} activities`}
                    {project.totalMinutes > 0 && `, ${formatMinutes(project.totalMinutes)}`}
                  </p>
                </li>
              ))}
            </ul>
          ) : <p className="rounded-lg border border-dashed bg-subtle px-5 py-6 text-sm text-muted-foreground">No project work this week.</p>}
        </section>
        <section aria-labelledby="review-idle">
          <h2 id="review-idle" className="mb-3 text-lg font-semibold">Active goals with no activity</h2>
          {review.idleGoals.length ? (
            <ul className="divide-y rounded-lg border bg-card">
              {review.idleGoals.map((goal) => (
                <li key={goal.id} className="px-5 py-3.5">
                  <Link href={`/goals/${goal.id}`} className="font-medium wrap-break-word hover:text-primary hover:underline">{goal.title}</Link>
                  <p className="text-xs text-muted-foreground">{goal.topicName}</p>
                </li>
              ))}
            </ul>
          ) : <p className="rounded-lg border border-dashed bg-subtle px-5 py-6 text-sm text-muted-foreground">Every active goal has activity this week.</p>}
        </section>
        <BlockerGroup id="review-blockers-opened" title="Blockers opened" blockers={review.blockersOpened} empty="No new blockers this week." />
        <BlockerGroup id="review-blockers-solved" title="Blockers solved" blockers={review.blockersSolved} empty="No blockers solved this week." />
      </div>
    </div>
  );
}
