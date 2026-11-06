import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Disclosure } from "@/components/disclosure";
import { Panel } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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

  const canLog = goal.status === "active";

  return (
    <GoalDetail
      goal={goal}
      actions={canLog && <Button asChild><Link href={`/goals/${goal.id}/log`}>Log this week</Link></Button>}
      aside={<>
        <Panel title="Status" id="goal-status-heading">
          <GoalStatusForm
            action={changeGoalStatusAction}
            goalId={goal.id}
            currentStatus={goal.status}
            activeGoals={activeGoals}
            activeGoalLimit={activeGoalLimit}
            topicArchived={goal.topicArchived}
          />
        </Panel>
        <Disclosure summary="Edit goal">
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
        </Disclosure>
      </>}
    >
      <section id="activity-history" aria-labelledby="activity-history-heading" className="scroll-mt-8 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="activity-history-heading" className="text-lg font-semibold">Activity history</h2>
          <p className="text-xs text-muted-foreground">Weekly totals include only activities with time recorded.</p>
        </div>
        {!canLog && <p className="text-sm text-muted-foreground">Only active goals can receive new activities.</p>}
        {Number.isInteger(logged) && logged > 0 && (
          <p role="status" className="rounded-md border border-primary/30 bg-secondary px-4 py-3 text-sm text-secondary-foreground">
            Saved {logged === 1 ? "1 activity" : `${logged} activities`}.
          </p>
        )}
        <ActivityHistory activities={activities} projects={projects} updateAction={updateActivityAction} deleteAction={deleteActivityAction} />
      </section>
    </GoalDetail>
  );
}
