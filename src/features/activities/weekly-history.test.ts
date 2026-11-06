import { expect, test } from "vitest";
import type { ActivityItem } from "@/features/activities/schemas";
import { groupActivitiesByWeek } from "@/features/activities/weekly-history";

let next = 0;
const activity = (occurredOn: string, minutes: number | null): ActivityItem => ({
  id: `activity-${(next += 1)}`, type: "reading", description: "Read the docs", minutes, occurredOn, project: null, resource: null,
});

test("activities are grouped into Monday-to-Sunday weeks, newest first", () => {
  const sunday = activity("2026-11-08", 30);
  const monday = activity("2026-11-02", 45);
  const previousSunday = activity("2026-11-01", 20);
  const weeks = groupActivitiesByWeek([previousSunday, monday, sunday]);

  expect(weeks.map((week) => week.weekStart)).toEqual(["2026-11-02", "2026-10-26"]);
  expect(weeks[0].activities).toEqual([sunday, monday]);
  expect(weeks[1].activities).toEqual([previousSunday]);
});

test("weekly totals include only activities with time recorded", () => {
  const [week] = groupActivitiesByWeek([
    activity("2026-11-03", 30), activity("2026-11-04", null), activity("2026-11-05", 90),
  ]);
  expect(week.totalMinutes).toBe(120);
  expect(week.untimedCount).toBe(1);
});

test("no activities means no weeks", () => {
  expect(groupActivitiesByWeek([])).toEqual([]);
});
