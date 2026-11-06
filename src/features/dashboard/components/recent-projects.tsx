import Link from "next/link";
import type { ProjectSummary } from "@/features/projects/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";

export function RecentProjects({ projects }: { projects: ProjectSummary[] }) {
  return (
    <section aria-labelledby="recent-projects-heading">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="recent-projects-heading" className="text-lg font-semibold">Recent projects</h2>
        {projects.length > 0 && <Link href="/projects" className="text-sm text-primary underline-offset-4 hover:underline">All projects</Link>}
      </div>
      {projects.length ? (
        <ul aria-label="Recent projects" className="divide-y rounded-lg border bg-card">
          {projects.map((project) => (
            <li key={project.id} className="px-5 py-3.5">
              <Link href={`/projects/${project.id}`} className="font-medium wrap-break-word hover:text-primary hover:underline">{project.title}</Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {project.lastActivityOn
                  ? <>Last worked on <time dateTime={project.lastActivityOn}>{formatCalendarDate(project.lastActivityOn)}</time></>
                  : "No activity yet"}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed bg-subtle px-5 py-6 text-sm leading-relaxed text-muted-foreground">
          No projects yet. <Link href="/projects" className="font-medium text-primary underline underline-offset-4">Add a project</Link> or log a &ldquo;Built a project&rdquo; activity.
        </div>
      )}
    </section>
  );
}
