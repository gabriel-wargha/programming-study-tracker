import type { Metadata } from "next";
import { Panel, PageHeader } from "@/components/page-header";
import { updateActiveGoalLimitAction } from "@/features/settings/actions";
import { ActiveGoalLimitForm } from "@/features/settings/components/active-goal-limit-form";
import { getActiveGoalLimit, listActiveGoals } from "@/features/goals/queries";
import { updatePortfolioAction } from "@/features/portfolio/actions";
import { PortfolioForm } from "@/features/portfolio/components/portfolio-form";
import { getPortfolioSettings } from "@/features/portfolio/mutations";
import { requireScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "Settings · Programming Study Tracker" };

export default async function SettingsPage() {
  const scope = await requireScope();
  const [activeGoals, activeGoalLimit, portfolio] = await Promise.all([
    listActiveGoals(scope), getActiveGoalLimit(scope), getPortfolioSettings(scope),
  ]);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" />
      <Panel title="Active goal limit" id="limit-heading" description="Keeping only a few goals active at once helps you finish them.">
        <ActiveGoalLimitForm action={updateActiveGoalLimitAction} activeGoalLimit={activeGoalLimit} activeGoals={activeGoals} />
      </Panel>
      <Panel title="Public portfolio" id="portfolio-heading" className="mt-6" description="Off by default. Mark goals and projects public on their own pages.">
        <PortfolioForm action={updatePortfolioAction} initialValues={portfolio} />
      </Panel>
    </div>
  );
}
