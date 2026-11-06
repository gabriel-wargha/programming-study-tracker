import { EmptyState } from "@/components/page-header";
import { confidenceLabels, type ConfidenceEntry } from "@/features/confidence/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";
import { todayInTimeZone } from "@/lib/dates/weeks";

function changeText(current: number, previous?: number) {
  if (previous === undefined) return "First rating";
  if (current === previous) return "No change";
  return current > previous ? `Up ${current - previous}` : `Down ${previous - current}`;
}

export function ConfidenceHistory({ ratings, timeZone }: { ratings: ConfidenceEntry[]; timeZone: string }) {
  if (!ratings.length) {
    return (
      <EmptyState title="No ratings yet" headingLevel={3}>
        <p>Rate this topic from 1 to 5 to start tracking your confidence.</p>
      </EmptyState>
    );
  }
  const [current] = ratings;
  return (
    <div className="rounded-lg border bg-card">
      <p className="border-b px-5 py-4 text-sm">
        <span className="text-muted-foreground">Current rating: </span>
        <span className="text-2xl font-semibold tabular-nums">{current.rating}</span>
        <span className="text-muted-foreground"> of 5, {confidenceLabels[current.rating].toLowerCase()}</span>
      </p>
      <ol aria-label="Rating history" className="divide-y">
        {ratings.map((entry, index) => {
          const date = todayInTimeZone(timeZone, entry.ratedAt);
          return (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-2.5 text-sm">
              <time dateTime={date} className="text-muted-foreground tabular-nums">{formatCalendarDate(date)}</time>
              <span className="flex items-center gap-3">
                <span aria-hidden="true" className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((step) => <span key={step} className={`h-3 w-2 rounded-sm ${step <= entry.rating ? "bg-primary" : "bg-muted"}`} />)}
                </span>
                <span className="font-medium tabular-nums">{entry.rating}</span>
                <span className="w-20 text-right text-xs text-muted-foreground">{changeText(entry.rating, ratings[index + 1]?.rating)}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
