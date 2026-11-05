import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    <div className="max-w-3xl space-y-6">
      <header>
        <Link href={`/goals/${goal.id}`} className="text-sm text-primary underline underline-offset-4 wrap-break-word">{goal.title}</Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Log this week</h1>
        <p className="mt-2 text-muted-foreground">Select what you did for this goal, describe it, and add the time spent.</p>
      </header>
      {goal.status === "active" ? (
        <section aria-label="Log form" className="rounded-xl border bg-card p-6">
          <ActivityLogForm action={logActivitiesAction} goalId={goal.id} projects={projects} />
        </section>
      ) : (
        <div role="status" className="rounded-xl border border-dashed p-8">
          <h2 className="font-semibold">This goal isn&apos;t active</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only active goals can receive new activities. Make the goal active on its <Link href={`/goals/${goal.id}`} className="text-primary underline underline-offset-4">goal page</Link> first.
          </p>
        </div>
      )}
    </div>
  );
}
