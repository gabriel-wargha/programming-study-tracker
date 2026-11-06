import Link from "next/link";
import { Pencil } from "lucide-react";
import { ExternalLink } from "@/components/external-link";
import { EmptyState } from "@/components/page-header";
import { ActivityTypeTag } from "@/features/activities/components/activity-type-tag";
import { ActivityEditForm } from "@/features/activities/components/activity-edit-form";
import { DeleteActivityForm } from "@/features/activities/components/delete-activity-form";
import { activityTypeLabels, type ActivityField, type ActivityItem } from "@/features/activities/schemas";
import { groupActivitiesByWeek } from "@/features/activities/weekly-history";
import type { ProjectOption } from "@/features/projects/schemas";
import type { ResourceOption } from "@/features/resources/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";
import { formatMinutes } from "@/lib/dates/format-minutes";
import { formatWeekRange } from "@/lib/dates/weeks";
import type { FormAction } from "@/lib/forms/action-state";

const activityCount = (count: number) => (count === 1 ? "1 activity" : `${count} activities`);

export function ActivityHistory({ activities, projects, resources = [], updateAction, deleteAction }: {
  activities: ActivityItem[];
  projects: ProjectOption[];
  resources?: ResourceOption[];
  updateAction: FormAction<ActivityField, { id: string }>;
  deleteAction: FormAction<"id", { id: string }>;
}) {
  if (!activities.length) {
    return (
      <EmptyState title="No activity yet" headingLevel={3}>
        <p>Logged activities appear here, grouped by week.</p>
      </EmptyState>
    );
  }
  return (
    <ol className="space-y-6" aria-label="Weeks">
      {groupActivitiesByWeek(activities).map((week) => {
        const headingId = `week-${week.weekStart}`;
        const timed = week.activities.length - week.untimedCount;
        return (
          <li key={week.weekStart}>
            <section aria-labelledby={headingId} className="overflow-hidden rounded-lg border bg-card">
              <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b bg-subtle px-5 py-3">
                <h3 id={headingId} className="text-sm font-semibold">Week of {formatWeekRange(week.weekStart)}</h3>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground tabular-nums">{timed ? formatMinutes(week.totalMinutes) : "No time"} recorded</span>
                  {" · "}{activityCount(week.activities.length)}
                  {week.untimedCount > 0 && timed > 0 && ` (${week.untimedCount} without time)`}
                </p>
              </header>
              <ul className="divide-y">
                {week.activities.map((activity) => {
                  const label = activityTypeLabels[activity.type];
                  const name = `${label} on ${formatCalendarDate(activity.occurredOn)}`;
                  return (
                    <li key={activity.id} className="space-y-2 px-5 py-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <ActivityTypeTag type={activity.type} />
                        <span className="text-xs text-muted-foreground tabular-nums">
                          <time dateTime={activity.occurredOn}>{formatCalendarDate(activity.occurredOn)}</time>
                          {" · "}{activity.minutes ? formatMinutes(activity.minutes) : "No time recorded"}
                        </span>
                      </div>
                      <p className="max-w-[70ch] text-[0.9375rem] leading-relaxed whitespace-pre-wrap wrap-break-word">{activity.description}</p>
                      {activity.project && (
                        <p className="text-sm text-muted-foreground">Project: <Link href={`/projects/${activity.project.id}`} className="font-medium text-primary underline-offset-4 hover:underline">{activity.project.title}</Link></p>
                      )}
                      {activity.resource && (
                        <p className="text-sm text-muted-foreground">
                          Resource: {activity.resource.url
                            ? <ExternalLink href={activity.resource.url}>{activity.resource.title}</ExternalLink>
                            : <span className="font-medium text-foreground">{activity.resource.title}</span>}
                        </p>
                      )}
                      <div className="flex flex-wrap items-start gap-2 pt-1">
                        <details className="group w-full sm:w-auto sm:flex-1 open:rounded-lg open:border open:p-4">
                          <summary className="inline-flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground group-open:mb-4 group-open:text-foreground [&::-webkit-details-marker]:hidden">
                            <Pencil aria-hidden="true" className="size-3.5" />Edit<span className="sr-only">: {name}</span>
                          </summary>
                          <ActivityEditForm action={updateAction} activity={activity} projects={projects} resources={resources} />
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
