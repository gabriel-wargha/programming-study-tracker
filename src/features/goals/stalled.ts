import { daysBetween } from "@/lib/dates/weeks";

export const STALLED_AFTER_DAYS = 14;

/**
 * Days without activity for an active goal, counted from its latest activity,
 * or from when it started if it has none. Null when there's nothing to count from.
 */
export function daysWithoutActivity({ lastActivityOn, startedOn }: { lastActivityOn: string | null; startedOn: string | null }, today: string): number | null {
  const from = lastActivityOn ?? startedOn;
  return from ? daysBetween(from, today) : null;
}

export function isStalled(goal: { status: string; lastActivityOn: string | null; startedOn: string | null }, today: string): boolean {
  if (goal.status !== "active") return false;
  const days = daysWithoutActivity(goal, today);
  return days !== null && days >= STALLED_AFTER_DAYS;
}
