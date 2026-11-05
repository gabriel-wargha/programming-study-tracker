import type { WeekSummary } from "@/features/dashboard/schemas";
import { formatMinutes } from "@/lib/dates/format-minutes";
import { formatWeekRange } from "@/lib/dates/weeks";

export function WeekSummaryPanel({ summary }: { summary: WeekSummary }) {
  const timed = summary.activityCount - summary.untimedCount;
  return (
    <section aria-labelledby="week-summary-heading" className="rounded-xl border bg-card p-6">
      <h2 id="week-summary-heading" className="font-semibold">This week</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        <time dateTime={summary.start}>{formatWeekRange(summary.start)}</time>
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-muted-foreground">Time recorded</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{timed ? formatMinutes(summary.totalMinutes) : "0 min"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Activities</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{summary.activityCount}</dd>
        </div>
      </dl>
      {summary.untimedCount > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          {summary.untimedCount === 1 ? "1 activity has" : `${summary.untimedCount} activities have`} no time recorded and {summary.untimedCount === 1 ? "isn't" : "aren't"} counted in the total.
        </p>
      )}
      {summary.activityCount === 0 && <p className="mt-4 text-sm text-muted-foreground">Nothing logged yet this week.</p>}
    </section>
  );
}
