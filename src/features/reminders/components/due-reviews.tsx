import Link from "next/link";
import { FinishReminderForm } from "@/features/reminders/components/finish-reminder-form";
import type { DueReminder } from "@/features/reminders/queries";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";
import type { FormAction } from "@/lib/forms/action-state";

export function DueReviews({ reminders, action }: { reminders: DueReminder[]; action: FormAction<"id", { id: string }> }) {
  return (
    <section aria-labelledby="due-reviews-heading">
      <div className="mb-3">
        <h2 id="due-reviews-heading" className="text-lg font-semibold">Reviews due</h2>
        <p className="text-sm text-muted-foreground">Go back over what you finished, so it sticks.</p>
      </div>
      <ul aria-label="Reviews due" className="divide-y rounded-lg border border-primary/30 bg-card">
        {reminders.map((reminder) => (
          <li key={reminder.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4">
            <div className="min-w-0">
              <Link href={`/goals/${reminder.goalId}`} className="font-semibold wrap-break-word hover:text-primary hover:underline">{reminder.goalTitle}</Link>
              <p className="text-xs text-muted-foreground">
                {reminder.topicName}. {reminder.stage === 1 ? "First review" : "Second review"}, due <time dateTime={reminder.dueOn} className="tabular-nums">{formatCalendarDate(reminder.dueOn)}</time>
              </p>
            </div>
            <FinishReminderForm action={action} reminderId={reminder.id} goalTitle={reminder.goalTitle} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Shown in place of the list, in a quieter spot, when nothing is due. */
export function NoReviewsDue() {
  return (
    <section aria-labelledby="due-reviews-heading">
      <h2 id="due-reviews-heading" className="mb-3 text-lg font-semibold">Reviews due</h2>
      <p className="rounded-lg border border-dashed bg-subtle px-5 py-6 text-sm leading-relaxed text-muted-foreground">
        Nothing to review. Completing a goal schedules a review 7 days later.
      </p>
    </section>
  );
}
