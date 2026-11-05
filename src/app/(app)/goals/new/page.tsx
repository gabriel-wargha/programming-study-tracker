import type { Metadata } from "next";
import Link from "next/link";
import { createGoalAction } from "@/features/goals/actions";
import { GoalForm } from "@/features/goals/components/goal-form";
import { getActiveGoalLimit, listActiveGoals } from "@/features/goals/queries";
import { listTopicOptions } from "@/features/topics/queries";
import { requireScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "New goal · Programming Study Tracker" };

export default async function NewGoalPage({ searchParams }: PageProps<"/goals/new">) {
  const scope = await requireScope();
  const [topics, activeGoals, activeGoalLimit] = await Promise.all([
    listTopicOptions(scope), listActiveGoals(scope), getActiveGoalLimit(scope),
  ]);
  const requested = (await searchParams).topic;
  const topicId = topics.find((topic) => topic.id === requested)?.id ?? "";

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">New goal</h1>
      {!topics.length && (
        <p className="text-sm">
          <Link href="/topics" className="font-medium text-primary underline underline-offset-4">Create a topic first</Link>
        </p>
      )}
      <GoalForm
        action={createGoalAction}
        topics={topics}
        activeGoals={activeGoals}
        activeGoalLimit={activeGoalLimit}
        initialValues={{ topicId, title: "", description: "", definitionOfDone: "", targetDate: "" }}
      />
    </div>
  );
}
