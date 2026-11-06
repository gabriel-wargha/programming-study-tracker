import type { Metadata } from "next";
import { Panel, PageHeader } from "@/components/page-header";
import { updateActiveGoalLimitAction } from "@/features/settings/actions";
import { ActiveGoalLimitForm } from "@/features/settings/components/active-goal-limit-form";
import { getActiveGoalLimit, listActiveGoals } from "@/features/goals/queries";
import { requireScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "Settings · Programming Study Tracker" };

export default async function SettingsPage() {
  const scope = await requireScope();
  const [activeGoals, activeGoalLimit] = await Promise.all([listActiveGoals(scope), getActiveGoalLimit(scope)]);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" />
      <Panel title="Active goal limit" id="limit-heading" description="Keeping only a few goals active at once helps you finish them.">
        <ActiveGoalLimitForm action={updateActiveGoalLimitAction} activeGoalLimit={activeGoalLimit} activeGoals={activeGoals} />
      </Panel>
    </div>
  );
}
