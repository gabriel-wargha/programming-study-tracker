import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { addConfidenceRatingAction } from "@/features/confidence/actions";
import { CompletionRatingPrompt } from "@/features/confidence/components/completion-rating-prompt";
import { Disclosure } from "@/components/disclosure";
import { Panel } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { deleteActivityAction, updateActivityAction } from "@/features/activities/actions";
import { ActivityHistory } from "@/features/activities/components/activity-history";
import { listGoalActivities } from "@/features/activities/queries";
import { changeGoalStatusAction, setGoalPublicAction, updateGoalAction } from "@/features/goals/actions";
import { PublicToggleForm } from "@/features/portfolio/components/public-toggle-form";
import { GoalDetail } from "@/features/goals/components/goal-detail";
import { GoalForm } from "@/features/goals/components/goal-form";
import { GoalStatusForm } from "@/features/goals/components/goal-status-form";
import { getActiveGoalLimit, getGoal, getGoalActivitySummary, listActiveGoals } from "@/features/goals/queries";
import { daysWithoutActivity, isStalled } from "@/features/goals/stalled";
import { createBlockerAction, reopenBlockerAction, solveBlockerAction } from "@/features/blockers/actions";
import { BlockerSection } from "@/features/blockers/components/blocker-section";
import { listGoalBlockers } from "@/features/blockers/queries";
import { listProjectOptions } from "@/features/projects/queries";
import { listResourceOptions } from "@/features/resources/queries";
import { PrerequisiteWarning } from "@/features/roadmap/components/prerequisite-warning";
import { listUnfinishedPrerequisites } from "@/features/roadmap/queries";
import { listTopicOptions } from "@/features/topics/queries";
import { requireScope } from "@/lib/auth/scope";
import { formatMinutes } from "@/lib/dates/format-minutes";
import { getOwnerCalendar } from "@/lib/dates/owner-today";
import { todayInTimeZone } from "@/lib/dates/weeks";

export const metadata: Metadata = { title: "Goal · Programming Study Tracker" };

export default async function GoalPage({ params, searchParams }: PageProps<"/goals/[id]">) {
  const { id } = await params;
  const logged = Number((await searchParams).logged);
  const scope = await requireScope();
  const goal = await getGoal(scope, id);
  if (!goal) notFound();
  const [topics, activeGoals, activeGoalLimit, activities, projects, summary, { today, timeZone }, resources, blockers, unfinished] = await Promise.all([
    listTopicOptions(scope, goal.topicId), listActiveGoals(scope), getActiveGoalLimit(scope),
    listGoalActivities(scope, goal.id), listProjectOptions(scope), getGoalActivitySummary(scope, goal.id), getOwnerCalendar(),
    listResourceOptions(scope, goal.topicId), listGoalBlockers(scope, goal.id), listUnfinishedPrerequisites(scope, goal.topicId),
  ]);
  const idle = {
    status: goal.status,
    lastActivityOn: summary?.lastActivityOn ?? null,
    startedOn: summary?.startedAt ? todayInTimeZone(timeZone, summary.startedAt) : null,
  };
  const stalled = isStalled(idle, today);

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
            completionPrompt={<CompletionRatingPrompt action={addConfidenceRatingAction} topicId={goal.topicId} topicName={goal.topicName} />}
          />
        </Panel>
        {goal.status === "completed" && (
          <Panel title="Portfolio" id="goal-portfolio-heading">
            <PublicToggleForm action={setGoalPublicAction} id={goal.id} isPublic={goal.isPublic} noun="goal" />
          </Panel>
        )}
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
      <PrerequisiteWarning prerequisites={unfinished} />
      {stalled && (
        <p role="status" className="flex items-start gap-2 rounded-lg border border-type-practice/30 bg-type-practice/5 px-4 py-3 text-sm text-type-practice">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span><span className="font-semibold">This goal is stalled.</span> It has had no activity for {daysWithoutActivity(idle, today)} days. Log something, or move it to planned to free up a slot.</span>
        </p>
      )}
      <section id="activity-history" aria-labelledby="activity-history-heading" className="scroll-mt-8 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="activity-history-heading" className="text-lg font-semibold">Activity history</h2>
          <p className="text-xs text-muted-foreground">
            {summary && summary.activityCount > 0 && `${formatMinutes(summary.totalMinutes)} recorded in total. `}
            Weekly totals include only activities with time recorded.
          </p>
        </div>
        {!canLog && <p className="text-sm text-muted-foreground">Only active goals can receive new activities.</p>}
        {Number.isInteger(logged) && logged > 0 && (
          <p role="status" className="rounded-md border border-primary/30 bg-secondary px-4 py-3 text-sm text-secondary-foreground">
            Saved {logged === 1 ? "1 activity" : `${logged} activities`}.
          </p>
        )}
        <ActivityHistory activities={activities} projects={projects} resources={resources} updateAction={updateActivityAction} deleteAction={deleteActivityAction} />
      </section>
      <BlockerSection
        goalId={goal.id}
        blockers={blockers}
        timeZone={timeZone}
        createAction={createBlockerAction}
        solveAction={solveBlockerAction}
        reopenAction={reopenBlockerAction}
      />
    </GoalDetail>
  );
}
