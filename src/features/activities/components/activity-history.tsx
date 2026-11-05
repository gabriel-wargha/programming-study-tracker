import Link from "next/link";
import { ActivityEditForm } from "@/features/activities/components/activity-edit-form";
import { DeleteActivityForm } from "@/features/activities/components/delete-activity-form";
import { activityTypeLabels, type ActivityField, type ActivityItem } from "@/features/activities/schemas";
import { groupActivitiesByWeek } from "@/features/activities/weekly-history";
import type { ProjectOption } from "@/features/projects/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";
import { formatMinutes } from "@/lib/dates/format-minutes";
import { formatWeekRange } from "@/lib/dates/weeks";
import type { FormAction } from "@/lib/forms/action-state";

const activityCount = (count: number) => (count === 1 ? "1 activity" : `${count} activities`);

export function ActivityHistory({ activities, projects, updateAction, deleteAction }: {
  activities: ActivityItem[];
  projects: ProjectOption[];
  updateAction: FormAction<ActivityField, { id: string }>;
  deleteAction: FormAction<"id", { id: string }>;
}) {
  if (!activities.length) {
    return (
      <div className="rounded-xl border border-dashed p-8">
        <h3 className="font-semibold">No activity yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Logged activities appear here, grouped by week.</p>
      </div>
    );
  }
  return (
    <ol className="space-y-6" aria-label="Weeks">
      {groupActivitiesByWeek(activities).map((week) => {
        const headingId = `week-${week.weekStart}`;
        const timed = week.activities.length - week.untimedCount;
        return (
          <li key={week.weekStart}>
            <section aria-labelledby={headingId} className="rounded-xl border bg-card">
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-4">
                <h3 id={headingId} className="font-semibold">Week of {formatWeekRange(week.weekStart)}</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{timed ? formatMinutes(week.totalMinutes) : "No time"} recorded</span>
                  {" · "}{activityCount(week.activities.length)}
                  {week.untimedCount > 0 && timed > 0 && ` (${week.untimedCount} without time)`}
                </p>
              </header>
              <ul className="divide-y">
                {week.activities.map((activity) => {
                  const label = activityTypeLabels[activity.type];
                  const name = `${label} on ${formatCalendarDate(activity.occurredOn)}`;
                  return (
                    <li key={activity.id} className="space-y-3 px-5 py-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium">{label}</span>
                        <time dateTime={activity.occurredOn} className="text-muted-foreground">{formatCalendarDate(activity.occurredOn)}</time>
                        <span className="text-muted-foreground">{activity.minutes ? formatMinutes(activity.minutes) : "No time recorded"}</span>
                      </div>
                      <p className="leading-7 whitespace-pre-wrap wrap-break-word">{activity.description}</p>
                      {activity.project && (
                        <p className="text-sm">Project: <Link href={`/projects/${activity.project.id}`} className="font-medium text-primary underline underline-offset-4">{activity.project.title}</Link></p>
                      )}
                      <div className="flex flex-wrap items-start gap-3">
                        <details className="group w-full rounded-md sm:w-auto sm:flex-1 [&[open]]:border [&[open]]:p-4">
                          <summary className="inline-flex min-h-9 cursor-pointer items-center rounded-md border px-3 text-sm font-medium hover:bg-accent group-open:mb-4">
                            Edit<span className="sr-only">: {name}</span>
                          </summary>
                          <ActivityEditForm action={updateAction} activity={activity} projects={projects} />
                        </details>
                        <DeleteActivityForm action={deleteAction} activityId={activity.id} activityName={name} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </li>
        );
      })}
    </ol>
  );
}
