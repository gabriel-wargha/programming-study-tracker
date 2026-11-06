import "server-only";

import { and, asc, between, desc, eq, inArray, sql } from "drizzle-orm";
import { activities, goals, topics } from "@/db/schema";
import type { DashboardGoal, WeekSummary } from "@/features/dashboard/schemas";
import { daysWithoutActivity, isStalled } from "@/features/goals/stalled";
import type { UserScope } from "@/lib/auth/scope";
import { addDays, todayInTimeZone } from "@/lib/dates/weeks";

type Week = { start: string; end: string };
type OwnerCalendar = { today: string; timeZone: string; week: Week };

/** Active goals with their latest activity and this week's progress. */
export async function listActiveGoalProgress(
  { db, userId }: UserScope,
  { today, timeZone, week }: OwnerCalendar,
): Promise<DashboardGoal[]> {
  const active = await db.select({ id: goals.id, title: goals.title, topicName: topics.name, startedAt: goals.startedAt }).from(goals)
    .innerJoin(topics, and(eq(topics.id, goals.topicId), eq(topics.userId, goals.userId)))
    .where(and(eq(goals.userId, userId), eq(goals.status, "active")))
    .orderBy(asc(goals.title));
  if (!active.length) return [];
  const ids = active.map((goal) => goal.id);
  const owned = and(eq(activities.userId, userId), inArray(activities.goalId, ids));

  const [latest, weekly] = await Promise.all([
    db.selectDistinctOn([activities.goalId], {
      goalId: activities.goalId, type: activities.type, description: activities.description, occurredOn: activities.occurredOn,
    }).from(activities).where(owned)
      .orderBy(activities.goalId, desc(activities.occurredOn), desc(activities.createdAt)),
    db.select({
      goalId: activities.goalId,
      count: sql<number>`count(*)::int`,
      minutes: sql<number>`coalesce(sum(${activities.minutes}), 0)::int`,
    }).from(activities).where(and(owned, between(activities.occurredOn, week.start, week.end)))
      .groupBy(activities.goalId),
  ]);

  return active.map(({ startedAt, ...goal }) => {
    const last = latest.find((row) => row.goalId === goal.id);
    const thisWeek = weekly.find((row) => row.goalId === goal.id);
    const idle = {
      status: "active",
      lastActivityOn: last?.occurredOn ?? null,
      startedOn: startedAt ? todayInTimeZone(timeZone, startedAt) : null,
    };
    return {
      ...goal,
      stalledDays: isStalled(idle, today) ? daysWithoutActivity(idle, today) : null,
      latestActivity: last ? { type: last.type, description: last.description, occurredOn: last.occurredOn } : null,
      weekActivityCount: thisWeek?.count ?? 0,
      weekMinutes: thisWeek?.minutes ?? 0,
    };
  });
}

/** Totals for every activity the owner logged in the week, across all goals, with a row per day. */
export async function getWeekSummary({ db, userId }: UserScope, week: Week): Promise<WeekSummary> {
  const rows = await db.select({
    date: activities.occurredOn,
    activityCount: sql<number>`count(*)::int`,
    minutes: sql<number>`coalesce(sum(${activities.minutes}), 0)::int`,
    timedCount: sql<number>`count(${activities.minutes})::int`,
  }).from(activities)
    .where(and(eq(activities.userId, userId), between(activities.occurredOn, week.start, week.end)))
    .groupBy(activities.occurredOn);

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(week.start, index);
    const row = rows.find((item) => item.date === date);
    return { date, activityCount: row?.activityCount ?? 0, minutes: row?.minutes ?? 0 };
  });
  const activityCount = rows.reduce((sum, row) => sum + row.activityCount, 0);
  return {
    ...week,
    activityCount,
    totalMinutes: rows.reduce((sum, row) => sum + row.minutes, 0),
    untimedCount: activityCount - rows.reduce((sum, row) => sum + row.timedCount, 0),
    days,
  };
}

/** Activity per day between two dates, for the calendar. Days with nothing are left out. */
export async function listCalendarDays({ db, userId }: UserScope, range: { start: string; end: string }) {
  return db.select({
    date: activities.occurredOn,
    count: sql<number>`count(*)::int`,
    minutes: sql<number>`coalesce(sum(${activities.minutes}), 0)::int`,
  }).from(activities)
    .where(and(eq(activities.userId, userId), between(activities.occurredOn, range.start, range.end)))
    .groupBy(activities.occurredOn);
}
