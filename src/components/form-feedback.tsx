import Link from "next/link";
import type { ActiveGoalLink } from "@/lib/forms/action-state";

export function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  return errors?.length ? <p id={id} className="mt-2 text-sm text-destructive">{errors[0]}</p> : null;
}

export function ActiveGoalList({ goals }: { goals: ActiveGoalLink[] }) {
  if (!goals.length) return <p className="text-sm text-muted-foreground">No active goals.</p>;
  return (
    <ul aria-label="Current active goals" className="mt-2 space-y-2 text-sm">
      {goals.map((goal) => <li key={goal.id}><Link className="font-medium text-primary underline underline-offset-4" href={`/goals/${goal.id}`}>{goal.title}</Link></li>)}
    </ul>
  );
}

export function FormFeedback({ state, success }: {
  state: { ok: true } | { ok: false; error: string; activeGoals?: ActiveGoalLink[] } | null;
  success: string;
}) {
  if (!state) return null;
  if (state.ok) return <p role="status" className="text-sm text-primary">{success}</p>;
  return (
    <div role="alert" className="rounded-md border border-destructive/30 p-3">
      <p className="text-sm text-destructive">{state.error}</p>
      {state.activeGoals && <ActiveGoalList goals={state.activeGoals} />}
    </div>
  );
}
