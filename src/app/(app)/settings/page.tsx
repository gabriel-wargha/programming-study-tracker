import type { Metadata } from "next";
import { updateActiveGoalLimitAction } from "@/features/settings/actions";
import { ActiveGoalLimitForm } from "@/features/settings/components/active-goal-limit-form";
import { getActiveGoalLimit, listActiveGoals } from "@/features/goals/queries";
import { requireScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "Settings · Programming Study Tracker" };

export default async function SettingsPage() {
  const scope = await requireScope();
  const [activeGoals, activeGoalLimit] = await Promise.all([listActiveGoals(scope), getActiveGoalLimit(scope)]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <section aria-labelledby="limit-heading" className="rounded-xl border bg-card p-6">
        <h2 id="limit-heading" className="mb-2 text-lg font-semibold">Active goal limit</h2>
        <p className="mb-4 text-sm leading-6 text-muted-foreground">
          Keeping only a few goals active at once helps you finish them.
        </p>
        <ActiveGoalLimitForm action={updateActiveGoalLimitAction} activeGoalLimit={activeGoalLimit} activeGoals={activeGoals} />
      </section>
    </div>
  );
}
