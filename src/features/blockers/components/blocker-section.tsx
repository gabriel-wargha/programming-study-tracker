import { EmptyState } from "@/components/page-header";
import { AddBlockerForm, ReopenBlockerForm, SolveBlockerForm } from "@/features/blockers/components/blocker-forms";
import type { BlockerField, BlockerItem, SolveField } from "@/features/blockers/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";
import { todayInTimeZone } from "@/lib/dates/weeks";
import type { FormAction } from "@/lib/forms/action-state";
import { Disclosure } from "@/components/disclosure";

export function BlockerSection({ goalId, blockers, timeZone, createAction, solveAction, reopenAction }: {
  goalId: string;
  blockers: BlockerItem[];
  timeZone: string;
  createAction: FormAction<BlockerField, { id: string }>;
  solveAction: FormAction<SolveField, { id: string }>;
  reopenAction: FormAction<"id", { id: string }>;
}) {
  const date = (value: Date) => formatCalendarDate(todayInTimeZone(timeZone, value));
  const open = blockers.filter((blocker) => blocker.status === "open").length;
  return (
    <section aria-labelledby="blockers-heading" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="blockers-heading" className="text-lg font-semibold">Blockers</h2>
        {blockers.length > 0 && <p className="text-xs text-muted-foreground tabular-nums">{open} open, {blockers.length - open} solved</p>}
      </div>
      {blockers.length ? (
        <ul aria-label="Blockers" className="divide-y rounded-lg border bg-card">
          {blockers.map((blocker) => (
            <li key={blocker.id} className="space-y-2 px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="font-medium wrap-break-word">{blocker.title}</h3>
                <span className="text-xs font-medium">{blocker.status === "open" ? "Open" : "Solved"}</span>
              </div>
              {blocker.details && <p className="max-w-[70ch] text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-muted-foreground">{blocker.details}</p>}
              <p className="text-xs text-muted-foreground tabular-nums">
                Added {date(blocker.createdAt)}{blocker.solvedAt && `. Solved ${date(blocker.solvedAt)}`}
              </p>
              {blocker.status === "solved" ? (
                <>
                  <div className="rounded-md border-l-2 border-l-type-reading bg-subtle px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground">Solution</p>
                    <p className="mt-1 max-w-[70ch] text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">{blocker.solution}</p>
                  </div>
                  <ReopenBlockerForm action={reopenAction} blockerId={blocker.id} blockerTitle={blocker.title} />
                </>
              ) : (
                <details className="group open:rounded-lg open:border open:p-4">
                  <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground group-open:mb-3 [&::-webkit-details-marker]:hidden">
                    Solve<span className="sr-only">: {blocker.title}</span>
                  </summary>
                  <SolveBlockerForm action={solveAction} blockerId={blocker.id} blockerTitle={blocker.title} initialSolution={blocker.solution ?? ""} />
                </details>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No blockers" headingLevel={3}>
          <p>Note problems here as you hit them, along with how you solved them.</p>
        </EmptyState>
      )}
      <Disclosure summary="Add a blocker">
        <AddBlockerForm action={createAction} goalId={goalId} />
      </Disclosure>
    </section>
  );
}
