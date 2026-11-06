import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { calendarStart } from "@/features/dashboard/calendar";
import { ActivityCalendar } from "@/features/dashboard/components/activity-calendar";
import { ActiveGoalProgress } from "@/features/dashboard/components/active-goal-progress";
import { RecentProjects } from "@/features/dashboard/components/recent-projects";
import { WeekSummaryPanel } from "@/features/dashboard/components/week-summary";
import { getWeekSummary, listActiveGoalProgress, listCalendarDays } from "@/features/dashboard/queries";
import { getActiveGoalLimit } from "@/features/goals/queries";
import { listProjects } from "@/features/projects/queries";
import { finishReminderAction } from "@/features/reminders/actions";
import { DueReviews, NoReviewsDue } from "@/features/reminders/components/due-reviews";
import { listDueReminders } from "@/features/reminders/queries";
import { requireScope } from "@/lib/auth/scope";
import { getOwnerCalendar } from "@/lib/dates/owner-today";

export const metadata: Metadata = { title: "Dashboard · Programming Study Tracker" };

export default async function DashboardPage() {
  const scope = await requireScope();
  const calendar = await getOwnerCalendar();
  const { today, week } = calendar;
  const [goals, summary, activeGoalLimit, projects, calendarDays, dueReminders] = await Promise.all([
    listActiveGoalProgress(scope, calendar), getWeekSummary(scope, week), getActiveGoalLimit(scope), listProjects(scope, { limit: 4 }),
    listCalendarDays(scope, { start: calendarStart(today), end: today }),
    listDueReminders(scope, today),
  ]);

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="space-y-10">
        {dueReminders.length > 0 && <DueReviews reminders={dueReminders} action={finishReminderAction} />}
        <WeekSummaryPanel summary={summary} today={today} />
        <div className="grid gap-10 xl:grid-cols-[1fr_18rem]">
          <ActiveGoalProgress goals={goals} activeGoalLimit={activeGoalLimit} />
          <div className="space-y-10">
            {dueReminders.length === 0 && <NoReviewsDue />}
            <RecentProjects projects={projects} />
          </div>
        </div>
        <ActivityCalendar days={calendarDays} today={today} />
      </div>
    </>
  );
}
