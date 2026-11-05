import type { Metadata } from "next";
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
  const { week } = await getOwnerCalendar();
  const [goals, summary, activeGoalLimit, projects] = await Promise.all([
    listActiveGoalProgress(scope, week), getWeekSummary(scope, week), getActiveGoalLimit(scope), listProjects(scope, { limit: 4 }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <ActiveGoalProgress goals={goals} activeGoalLimit={activeGoalLimit} />
        <div className="space-y-6">
          <WeekSummaryPanel summary={summary} />
          <RecentProjects projects={projects} />
        </div>
      </div>
    </div>
  );
}
