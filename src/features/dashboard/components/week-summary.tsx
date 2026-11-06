import type { WeekSummary } from "@/features/dashboard/schemas";
import { formatMinutes, formatMinutesShort } from "@/lib/dates/format-minutes";
import { formatWeekRange } from "@/lib/dates/weeks";
import { cn } from "@/lib/utils";

const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
const toDate = (value: string) => new Date(`${value}T00:00:00Z`);

/** This week at a glance: one column per day, Monday to Sunday, with recorded time as a bar. */
export function WeekSummaryPanel({ summary, today }: { summary: WeekSummary; today?: string }) {
  const timed = summary.activityCount - summary.untimedCount;
  const longest = Math.max(...summary.days.map((day) => day.minutes), 1);

  return (
    <section aria-labelledby="week-summary-heading" className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-5 pt-5">
        <div>
          <h2 id="week-summary-heading" className="text-sm font-semibold">This week</h2>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">
            <time dateTime={summary.start}>{formatWeekRange(summary.start)}</time>
          </p>
        </div>
        <dl className="flex items-end gap-6">
          <div>
            <dt className="text-xs text-muted-foreground">Time recorded</dt>
            <dd className="text-2xl font-semibold tracking-tight tabular-nums">{timed ? formatMinutes(summary.totalMinutes) : "0 min"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Activities</dt>
            <dd className="text-2xl font-semibold tracking-tight tabular-nums">{summary.activityCount}</dd>
          </div>
        </dl>
      </div>

      <ol aria-label="Days this week" className="mt-5 grid grid-cols-7 gap-1 px-3 sm:gap-2 sm:px-5">
        {summary.days.map((day) => {
          const isToday = day.date === today;
          const isFuture = Boolean(today && day.date > today);
          const height = day.minutes ? Math.max(8, Math.round((day.minutes / longest) * 100)) : 0;
          const label = `${longDay.format(toDate(day.date))}: ${day.activityCount === 0 ? "nothing logged" :
            `${day.activityCount === 1 ? "1 activity" : `${day.activityCount} activities`}${day.minutes ? `, ${formatMinutes(day.minutes)}` : ", no time recorded"}`}${isToday ? " (today)" : ""}`;
          return (
            <li key={day.date} className={cn("flex flex-col items-center gap-1.5 rounded-md py-2", isToday && "bg-secondary")}>
              <span className="sr-only">{label}</span>
              <span aria-hidden="true" className={cn("text-[0.6875rem] font-medium", isToday ? "text-secondary-foreground" : "text-muted-foreground")}>
                {weekday.format(toDate(day.date))}
              </span>
              <span aria-hidden="true" className={cn(
                "relative flex h-16 w-full max-w-9 items-end overflow-hidden rounded-sm",
                isFuture ? "border border-dashed" : "bg-muted",
              )}>
                {height > 0 && <span className="w-full rounded-sm bg-primary" style={{ height: `${height}%` }} />}
                {height === 0 && day.activityCount > 0 && <span className="mx-auto mb-1.5 size-1.5 rounded-full bg-primary" />}
              </span>
              <span aria-hidden="true" className={cn("font-mono text-[0.6875rem] tabular-nums", day.minutes ? "text-foreground" : "text-muted-foreground")}>
                {day.minutes ? formatMinutesShort(day.minutes) : day.activityCount ? "·" : "–"}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="border-t px-5 py-3 text-xs leading-relaxed text-muted-foreground">
        {summary.activityCount === 0
          ? "Nothing logged yet this week."
          : summary.untimedCount > 0
            ? `${summary.untimedCount === 1 ? "1 activity has" : `${summary.untimedCount} activities have`} no time recorded and ${summary.untimedCount === 1 ? "isn't" : "aren't"} counted in the total.`
            : "Weeks run Monday to Sunday."}
      </p>
    </section>
  );
}
