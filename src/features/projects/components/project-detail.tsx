import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink } from "@/components/external-link";
import type { ProjectGoal, ProjectSummary } from "@/features/projects/schemas";
import { formatMinutes } from "@/lib/dates/format-minutes";

export function ProjectDetail({ project, goals, children }: { project: ProjectSummary; goals: ProjectGoal[]; children?: ReactNode }) {
  return (
    <article className="space-y-8">
      <header>
        <Link href="/projects" className="text-sm text-primary underline underline-offset-4">Projects</Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight wrap-break-word">{project.title}</h1>
        {project.description && <p className="mt-4 max-w-2xl leading-7 whitespace-pre-wrap wrap-break-word text-muted-foreground">{project.description}</p>}
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6">
          <dt className="font-medium">Repository</dt>
          <dd><ExternalLink href={project.repoUrl}>{project.repoUrl}</ExternalLink></dd>
          {project.liveUrl && <>
            <dt className="font-medium">Live site</dt>
            <dd><ExternalLink href={project.liveUrl}>{project.liveUrl}</ExternalLink></dd>
          </>}
        </dl>
      </header>
      <section aria-labelledby="project-goals">
        <h2 id="project-goals" className="mb-4 text-xl font-semibold">Linked goals</h2>
        {goals.length ? (
          <ul className="grid gap-3">
            {goals.map((goal) => (
              <li key={goal.id} className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{goal.topicName}</p>
                <Link href={`/goals/${goal.id}`} className="font-medium hover:underline">{goal.title}</Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {goal.activityCount === 1 ? "1 activity" : `${goal.activityCount} activities`}
                  {goal.totalMinutes > 0 && ` · ${formatMinutes(goal.totalMinutes)} recorded`}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            No goals link to this project yet. Log a &ldquo;Built a project&rdquo; activity on an active goal to link one.
          </p>
        )}
      </section>
      {children}
    </article>
  );
}
