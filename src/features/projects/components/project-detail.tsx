import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink } from "@/components/external-link";
import { EmptyState, PageHeader } from "@/components/page-header";
import { displayUrl } from "@/features/projects/components/project-list";
import type { ProjectGoal, ProjectSummary } from "@/features/projects/schemas";
import { formatMinutes } from "@/lib/dates/format-minutes";

export function ProjectDetail({ project, goals, aside }: { project: ProjectSummary; goals: ProjectGoal[]; aside?: ReactNode }) {
  return (
    <article>
      <PageHeader
        back={{ href: "/projects", label: "Projects" }}
        title={project.title}
        description={project.description && <p className="whitespace-pre-wrap wrap-break-word">{project.description}</p>}
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-10">
          <dl className="divide-y rounded-lg border bg-card text-sm">
            <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:gap-6">
              <dt className="w-24 shrink-0 text-muted-foreground">Repository</dt>
              <dd className="min-w-0 font-mono text-[0.8125rem]"><ExternalLink href={project.repoUrl}>{displayUrl(project.repoUrl)}</ExternalLink></dd>
            </div>
            {project.liveUrl && (
              <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:gap-6">
                <dt className="w-24 shrink-0 text-muted-foreground">Live site</dt>
                <dd className="min-w-0 font-mono text-[0.8125rem]"><ExternalLink href={project.liveUrl}>{displayUrl(project.liveUrl)}</ExternalLink></dd>
              </div>
            )}
          </dl>
          <section aria-labelledby="project-goals">
            <h2 id="project-goals" className="mb-3 text-lg font-semibold">Linked goals</h2>
            {goals.length ? (
              <ul className="divide-y rounded-lg border bg-card">
                {goals.map((goal) => (
                  <li key={goal.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3.5">
                    <div className="min-w-0">
                      <Link href={`/goals/${goal.id}`} className="font-medium wrap-break-word hover:text-primary hover:underline">{goal.title}</Link>
                      <p className="text-xs text-muted-foreground">{goal.topicName}</p>
                    </div>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {goal.activityCount === 1 ? "1 activity" : `${goal.activityCount} activities`}
                      {goal.totalMinutes > 0 && ` · ${formatMinutes(goal.totalMinutes)} recorded`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No linked goals yet" headingLevel={3}>
                <p>No goals link to this project yet. Log a &ldquo;Built a project&rdquo; activity on an active goal to link one.</p>
              </EmptyState>
            )}
          </section>
        </div>
        {aside && <aside aria-label="Project settings" className="space-y-4 lg:sticky lg:top-10 lg:self-start">{aside}</aside>}
      </div>
    </article>
  );
}
