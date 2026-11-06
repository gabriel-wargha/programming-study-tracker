import Link from "next/link";
import { EmptyState } from "@/components/page-header";
import type { ProjectSummary } from "@/features/projects/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";

/** "github.com/owner/repo" from a full URL, for compact display. */
export function displayUrl(url: string) {
  return url.replace(/^https:\/\//, "").replace(/\/$/, "");
}

export function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  if (!projects.length) {
    return (
      <EmptyState title="No projects yet">
        <p>Add a project here, or while logging a &ldquo;Built a project&rdquo; activity.</p>
      </EmptyState>
    );
  }
  return (
    <ul aria-label="Projects" className="divide-y rounded-lg border bg-card">
      {projects.map((project) => (
        <li key={project.id} className="px-5 py-4 hover:bg-subtle">
          <h2 className="font-semibold wrap-break-word">
            <Link href={`/projects/${project.id}`} className="rounded-sm hover:text-primary hover:underline">{project.title}</Link>
          </h2>
          <p className="mt-0.5 font-mono text-xs break-all text-muted-foreground">{displayUrl(project.repoUrl)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {project.goalCount === 1 ? "1 goal" : `${project.goalCount} goals`}, {project.activityCount === 1 ? "1 activity" : `${project.activityCount} activities`}
            {project.lastActivityOn && <>. Last worked on <time dateTime={project.lastActivityOn} className="tabular-nums">{formatCalendarDate(project.lastActivityOn)}</time></>}
          </p>
        </li>
      ))}
    </ul>
  );
}
