import type { ReactNode } from "react";
import type { ProjectSummary } from "@/features/projects/schemas";
import { isGitHubStale } from "@/features/projects/schemas";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";
import { todayInTimeZone } from "@/lib/dates/weeks";

/** Language shares in descending order; anything under 1% is left out. */
export function languageShares(languages: Record<string, number> | null) {
  const entries = Object.entries(languages ?? {});
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (!total) return [];
  return entries.map(([name, bytes]) => ({ name, percent: Math.round((bytes / total) * 100) }))
    .filter((language) => language.percent >= 1)
    .sort((a, b) => b.percent - a.percent);
}

export function GitHubDetails({ project, timeZone, now, refresh, message }: {
  project: ProjectSummary;
  timeZone: string;
  now: Date;
  refresh: ReactNode;
  message?: string;
}) {
  const shares = languageShares(project.githubLanguages);
  const date = (value: Date) => formatCalendarDate(todayInTimeZone(timeZone, value));
  return (
    <section aria-labelledby="github-heading" className="rounded-lg border bg-card">
      <h2 id="github-heading" className="border-b px-5 py-3.5 text-sm font-semibold">GitHub details</h2>
      <div className="space-y-4 p-5 text-sm">
        {message && <p role="alert" className="rounded-md border border-destructive/30 p-3 text-destructive">{message}</p>}
        {project.githubSyncedAt ? (
          <>
            <dl className="grid gap-3">
              <div><dt className="text-xs text-muted-foreground">Repository</dt><dd className="font-mono text-[0.8125rem] break-all">{project.githubFullName}</dd></div>
              {project.githubDescription && <div><dt className="text-xs text-muted-foreground">Description</dt><dd className="leading-relaxed wrap-break-word">{project.githubDescription}</dd></div>}
              {project.githubLastCommitAt && <div><dt className="text-xs text-muted-foreground">Latest commit</dt><dd className="tabular-nums">{date(project.githubLastCommitAt)}</dd></div>}
              {shares.length > 0 && (
                <div>
                  <dt className="text-xs text-muted-foreground">Languages</dt>
                  <dd>
                    <ul aria-label="Languages" className="mt-1 grid gap-1.5">
                      {shares.map((language) => (
                        <li key={language.name} className="grid grid-cols-[1fr_3rem] items-center gap-x-3 gap-y-0.5">
                          <span className="truncate">{language.name}</span>
                          <span className="text-right text-xs text-muted-foreground tabular-nums">{language.percent}%</span>
                          <span aria-hidden="true" className="col-span-2 h-1 overflow-hidden rounded-full bg-muted">
                            <span className="block h-full rounded-full bg-primary" style={{ width: `${language.percent}%` }} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
            <p className="text-xs text-muted-foreground">
              Updated {date(project.githubSyncedAt)}.{isGitHubStale(project.githubSyncedAt, now) && " These details are more than a day old."}
            </p>
          </>
        ) : !message && (
          <p className="text-muted-foreground">No details loaded yet. Refresh to read them from GitHub.</p>
        )}
        {refresh}
      </div>
    </section>
  );
}
