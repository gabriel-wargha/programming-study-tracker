import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, PageHeader } from "@/components/page-header";
import { logActivitiesAction } from "@/features/activities/actions";
import { ActivityLogForm } from "@/features/activities/components/activity-log-form";
import { getGoal } from "@/features/goals/queries";
import { listProjectOptions } from "@/features/projects/queries";
import { requireScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "Log this week · Programming Study Tracker" };

export default async function LogGoalPage({ params }: PageProps<"/goals/[id]/log">) {
  const { id } = await params;
  const scope = await requireScope();
  const goal = await getGoal(scope, id);
  if (!goal) notFound();
  const projects = goal.status === "active" ? await listProjectOptions(scope) : [];

  return (
    <div className="max-w-3xl">
      <PageHeader
        back={{ href: `/goals/${goal.id}`, label: goal.title }}
        title="Log this week"
        description="Select what you did for this goal, describe it, and add the time spent."
      />
      {goal.status === "active" ? (
        <section aria-label="Log form" className="rounded-lg border bg-card p-5 sm:p-6">
          <ActivityLogForm action={logActivitiesAction} goalId={goal.id} projects={projects} />
        </section>
      ) : (
        <div role="status">
          <EmptyState title="This goal isn't active">
            <p>
              Only active goals can receive new activities. Make the goal active on its <Link href={`/goals/${goal.id}`} className="font-medium text-primary underline underline-offset-4">goal page</Link> first.
            </p>
          </EmptyState>
        </div>
      )}
    </div>
  );
}
