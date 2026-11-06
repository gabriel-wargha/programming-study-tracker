import { buildCalendar } from "@/features/dashboard/calendar";
import { cn } from "@/lib/utils";

const levelClass = ["bg-muted", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"] as const;

export function ActivityCalendar({ days, today }: { days: { date: string; count: number; minutes: number }[]; today: string }) {
  const { cells, months, columns, studyDays } = buildCalendar(days, today);
  const grid = { gridTemplateColumns: `repeat(${columns}, var(--cell))` };

  return (
    <section aria-labelledby="calendar-heading" className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="calendar-heading" className="text-sm font-semibold">Last 12 months</h2>
        <p className="text-xs text-muted-foreground">{studyDays === 1 ? "1 study day" : `${studyDays} study days`}</p>
      </div>
      {/* Row-reverse starts the scroll position at the newest weeks on narrow screens. */}
      <div role="region" aria-label="Activity calendar, scrollable" tabIndex={0} className="mt-4 flex flex-row-reverse overflow-x-auto rounded-sm pb-2">
        <div className="w-max shrink-0 [--cell:0.75rem] xl:[--cell:0.9rem]">
          <div aria-hidden="true" style={grid} className="mb-1 grid gap-0.5 text-[0.6875rem] leading-4 text-muted-foreground">
            {months.map((month) => <span key={month.column} style={{ gridColumnStart: month.column + 1 }} className="whitespace-nowrap">{month.label}</span>)}
          </div>
          <ul aria-label="Study days" style={grid} className="grid grid-flow-col grid-rows-7 gap-0.5">
            {cells.map((cell) => cell.kind === "blank"
              ? <li key={cell.date} aria-hidden="true" className="size-(--cell)" />
              : (
                <li key={cell.date} title={cell.label} className={cn("size-(--cell) rounded-[2px]", levelClass[cell.level])}>
                  <span className="sr-only">{cell.label}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>
      <div aria-hidden="true" className="mt-2 flex items-center justify-end gap-1 text-[0.6875rem] text-muted-foreground">
        Fewer
        {levelClass.map((level) => <span key={level} className={cn("size-3 rounded-[2px]", level)} />)}
        More
      </div>
    </section>
  );
}
