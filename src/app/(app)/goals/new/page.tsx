import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
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
    <div className="max-w-2xl">
      <PageHeader
        back={{ href: "/goals", label: "Goals" }}
        title="New goal"
        description="Keep it small enough to finish in a few weeks, and describe exactly what done looks like."
      />
      {!topics.length && (
        <p className="mb-4 text-sm">
          <Link href="/topics" className="font-medium text-primary underline underline-offset-4">Create a topic first</Link>
        </p>
      )}
      <div className="rounded-lg border bg-card p-5 sm:p-6">
        <GoalForm
          action={createGoalAction}
          topics={topics}
          activeGoals={activeGoals}
          activeGoalLimit={activeGoalLimit}
          initialValues={{ topicId, title: "", description: "", definitionOfDone: "", targetDate: "" }}
        />
      </div>
    </div>
  );
}
