import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteActivityAction, updateActivityAction } from "@/features/activities/actions";
import { ActivityHistory } from "@/features/activities/components/activity-history";
import { listGoalActivities } from "@/features/activities/queries";
import { changeGoalStatusAction, updateGoalAction } from "@/features/goals/actions";
import { GoalDetail } from "@/features/goals/components/goal-detail";
import { GoalForm } from "@/features/goals/components/goal-form";
import { GoalStatusForm } from "@/features/goals/components/goal-status-form";
import { getActiveGoalLimit, getGoal, listActiveGoals } from "@/features/goals/queries";
import { listProjectOptions } from "@/features/projects/queries";
import { listTopicOptions } from "@/features/topics/queries";
import { requireScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "Goal · Programming Study Tracker" };

export default async function GoalPage({ params, searchParams }: PageProps<"/goals/[id]">) {
  const { id } = await params;
  const logged = Number((await searchParams).logged);
  const scope = await requireScope();
  const goal = await getGoal(scope, id);
  if (!goal) notFound();
  const [topics, activeGoals, activeGoalLimit, activities, projects] = await Promise.all([
    listTopicOptions(scope, goal.topicId), listActiveGoals(scope), getActiveGoalLimit(scope),
    listGoalActivities(scope, goal.id), listProjectOptions(scope),
  ]);

  return (
    <GoalDetail goal={goal}>
      <section id="activity-history" aria-labelledby="activity-history-heading" className="scroll-mt-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="activity-history-heading" className="text-xl font-semibold">Activity history</h2>
          {goal.status === "active" ? (
            <Link href={`/goals/${goal.id}/log`} className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none">
              Log this week
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">Only active goals can receive new activities.</p>
          )}
        </div>
        {Number.isInteger(logged) && logged > 0 && (
          <p role="status" className="rounded-md border border-primary/30 p-3 text-sm text-primary">
            Saved {logged === 1 ? "1 activity" : `${logged} activities`}.
          </p>
        )}
        <p className="text-sm text-muted-foreground">Weekly totals include only activities with time recorded.</p>
        <ActivityHistory activities={activities} projects={projects} updateAction={updateActivityAction} deleteAction={deleteActivityAction} />
      </section>
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
