import Link from "next/link";
import type { ProjectSummary } from "@/features/projects/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";

export function RecentProjects({ projects }: { projects: ProjectSummary[] }) {
  return (
    <section aria-labelledby="recent-projects-heading" className="rounded-xl border bg-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="recent-projects-heading" className="font-semibold">Recent projects</h2>
        {projects.length > 0 && <Link href="/projects" className="text-sm text-primary underline underline-offset-4">All projects</Link>}
      </div>
      {projects.length ? (
        <ul aria-label="Recent projects" className="mt-4 divide-y">
          {projects.map((project) => (
            <li key={project.id} className="py-3 first:pt-0 last:pb-0">
              <Link href={`/projects/${project.id}`} className="font-medium wrap-break-word hover:underline">{project.title}</Link>
              <p className="mt-1 text-xs text-muted-foreground">
                {project.lastActivityOn
                  ? <>Last worked on <time dateTime={project.lastActivityOn}>{formatCalendarDate(project.lastActivityOn)}</time></>
                  : "No activity yet"}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          No projects yet. <Link href="/projects" className="text-primary underline underline-offset-4">Add a project</Link> or log a &ldquo;Built a project&rdquo; activity.
        </p>
      )}
    </section>
  );
}
