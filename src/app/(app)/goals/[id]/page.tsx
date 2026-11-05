import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { changeGoalStatusAction, updateGoalAction } from "@/features/goals/actions";
import { GoalDetail } from "@/features/goals/components/goal-detail";
import { GoalForm } from "@/features/goals/components/goal-form";
import { GoalStatusForm } from "@/features/goals/components/goal-status-form";
import { getActiveGoalLimit, getGoal, listActiveGoals } from "@/features/goals/queries";
import { listTopicOptions } from "@/features/topics/queries";
import { requireScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "Goal · Programming Study Tracker" };

export default async function GoalPage({ params }: PageProps<"/goals/[id]">) {
  const { id } = await params;
  const scope = await requireScope();
  const goal = await getGoal(scope, id);
  if (!goal) notFound();
  const [topics, activeGoals, activeGoalLimit] = await Promise.all([
    listTopicOptions(scope, goal.topicId), listActiveGoals(scope), getActiveGoalLimit(scope),
  ]);

  return (
    <GoalDetail goal={goal}>
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <section aria-labelledby="goal-status-heading" className="h-fit rounded-xl border bg-card p-6">
          <h2 id="goal-status-heading" className="mb-4 text-lg font-semibold">Status</h2>
          <GoalStatusForm
            action={changeGoalStatusAction}
            goalId={goal.id}
            currentStatus={goal.status}
            activeGoals={activeGoals}
            activeGoalLimit={activeGoalLimit}
            topicArchived={goal.topicArchived}
          />
        </section>
        <section aria-labelledby="edit-goal-heading" className="rounded-xl border bg-card p-6">
          <h2 id="edit-goal-heading" className="mb-4 text-lg font-semibold">Edit goal</h2>
          <GoalForm
            action={updateGoalAction}
            topics={topics}
            activeGoals={activeGoals}
            activeGoalLimit={activeGoalLimit}
            initialValues={{
              id: goal.id,
              topicId: goal.topicId,
              title: goal.title,
              description: goal.description ?? "",
              definitionOfDone: goal.definitionOfDone,
              targetDate: goal.targetDate ?? "",
            }}
          />
        </section>
      </div>
    </GoalDetail>
  );
}
