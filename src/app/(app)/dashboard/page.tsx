import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ActiveGoalProgress } from "@/features/dashboard/components/active-goal-progress";
import { RecentProjects } from "@/features/dashboard/components/recent-projects";
import { WeekSummaryPanel } from "@/features/dashboard/components/week-summary";
import { getWeekSummary, listActiveGoalProgress } from "@/features/dashboard/queries";
import { getActiveGoalLimit } from "@/features/goals/queries";
import { listProjects } from "@/features/projects/queries";
import { requireScope } from "@/lib/auth/scope";
import { getOwnerCalendar } from "@/lib/dates/owner-today";

export const metadata: Metadata = { title: "Dashboard · Programming Study Tracker" };

export default async function DashboardPage() {
  const scope = await requireScope();
  const { today, week } = await getOwnerCalendar();
  const [goals, summary, activeGoalLimit, projects] = await Promise.all([
    listActiveGoalProgress(scope, week), getWeekSummary(scope, week), getActiveGoalLimit(scope), listProjects(scope, { limit: 4 }),
  ]);

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="space-y-10">
        <WeekSummaryPanel summary={summary} today={today} />
        <div className="grid gap-10 xl:grid-cols-[1fr_18rem]">
          <ActiveGoalProgress goals={goals} activeGoalLimit={activeGoalLimit} />
          <RecentProjects projects={projects} />
        </div>
      </div>
    </>
  );
}
