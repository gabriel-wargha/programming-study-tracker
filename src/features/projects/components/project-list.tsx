import Link from "next/link";
import { ExternalLink } from "@/components/external-link";
import type { ProjectSummary } from "@/features/projects/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";

export function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  if (!projects.length) {
    return (
      <div className="rounded-xl border border-dashed p-8">
        <h2 className="font-semibold">No projects yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Add a project here, or while logging a &ldquo;Built a project&rdquo; activity.</p>
      </div>
    );
  }
  return (
    <ul aria-label="Projects" className="grid gap-4">
      {projects.map((project) => (
        <li key={project.id} className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold wrap-break-word"><Link href={`/projects/${project.id}`} className="rounded-sm hover:underline">{project.title}</Link></h2>
          <p className="mt-2 text-sm"><ExternalLink href={project.repoUrl}>{project.repoUrl}</ExternalLink></p>
          <p className="mt-3 text-xs text-muted-foreground">
            {project.goalCount === 1 ? "1 goal" : `${project.goalCount} goals`} · {project.activityCount === 1 ? "1 activity" : `${project.activityCount} activities`}
            {project.lastActivityOn && <> · Last worked on <time dateTime={project.lastActivityOn}>{formatCalendarDate(project.lastActivityOn)}</time></>}
          </p>
        </li>
      ))}
    </ul>
  );
}
