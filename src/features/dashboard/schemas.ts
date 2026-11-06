import type { ActivityType } from "@/features/activities/schemas";

export type DashboardGoal = {
  id: string;
  title: string;
  topicName: string;
  latestActivity: { type: ActivityType; description: string; occurredOn: string } | null;
  /** Activities and recorded minutes in the owner's current week. */
  weekActivityCount: number;
  weekMinutes: number;
  /** Days without activity, shown when the goal is stalled; otherwise null. */
  stalledDays: number | null;
};

export type WeekDay = { date: string; activityCount: number; minutes: number };

export type WeekSummary = {
  start: string;
  end: string;
  activityCount: number;
  /** Only activities with time recorded count toward the total. */
  totalMinutes: number;
  untimedCount: number;
  /** Monday through Sunday, including days with nothing logged. */
  days: WeekDay[];
};
