import type { ActivityItem } from "@/features/activities/schemas";
import { startOfWeek } from "@/lib/dates/weeks";

export type ActivityWeek = {
  /** The Monday that starts the week. */
  weekStart: string;
  activities: ActivityItem[];
  /** Only activities with time recorded count toward the total. */
  totalMinutes: number;
  untimedCount: number;
};

/** Groups activities (newest first) into Monday-to-Sunday weeks, newest week first. */
export function groupActivitiesByWeek(activities: ActivityItem[]): ActivityWeek[] {
  const weeks = new Map<string, ActivityWeek>();
  const sorted = [...activities].sort((a, b) => b.occurredOn.localeCompare(a.occurredOn));
  for (const activity of sorted) {
    const weekStart = startOfWeek(activity.occurredOn);
    let week = weeks.get(weekStart);
    if (!week) {
      week = { weekStart, activities: [], totalMinutes: 0, untimedCount: 0 };
      weeks.set(weekStart, week);
    }
    week.activities.push(activity);
    if (activity.minutes === null) week.untimedCount += 1;
    else week.totalMinutes += activity.minutes;
  }
  return [...weeks.values()];
}
