import { ExternalLink } from "@/components/external-link";
import { displayUrl } from "@/features/projects/components/project-list";
import { languageShares } from "@/features/projects/components/github-details";
import type { PublicPortfolio } from "@/features/portfolio/queries";

const monthYear = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

export function PublicPortfolioView({ portfolio }: { portfolio: PublicPortfolio }) {
  const empty = !portfolio.goals.length && !portfolio.projects.length;
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 focus:outline-none sm:px-8 sm:py-16">
      <header className="mb-12 space-y-3">
        <h1 className="text-[2rem] leading-tight font-semibold tracking-tight wrap-break-word sm:text-[2.5rem]">{portfolio.displayName ?? "Programming portfolio"}</h1>
        {portfolio.headline && <p className="max-w-[60ch] text-lg leading-relaxed wrap-break-word text-muted-foreground">{portfolio.headline}</p>}
        {portfolio.githubUsername && (
          <p className="font-mono text-sm"><ExternalLink href={`https://github.com/${portfolio.githubUsername}`}>{`github.com/${portfolio.githubUsername}`}</ExternalLink></p>
        )}
      </header>

      {empty && <p className="rounded-lg border border-dashed bg-subtle px-6 py-8 text-sm text-muted-foreground">Nothing has been shared here yet.</p>}

      {portfolio.projects.length > 0 && (
        <section aria-labelledby="portfolio-projects" className="mb-12">
          <h2 id="portfolio-projects" className="mb-3 text-lg font-semibold">Projects</h2>
          <ul className="divide-y rounded-lg border bg-card">
            {portfolio.projects.map((project, index) => {
              const languages = languageShares(project.languages).slice(0, 4);
              return (
                <li key={index} className="space-y-2 px-5 py-4">
                  <h3 className="font-semibold wrap-break-word">{project.title}</h3>
                  {project.description && <p className="max-w-[65ch] text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-muted-foreground">{project.description}</p>}
                  <p className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.8125rem]">
                    <ExternalLink href={project.repoUrl}>{displayUrl(project.repoUrl)}</ExternalLink>
                    {project.liveUrl && <ExternalLink href={project.liveUrl}>{displayUrl(project.liveUrl)}</ExternalLink>}
                  </p>
                  {(languages.length > 0 || project.lastCommitAt) && (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {languages.map((language) => `${language.name} ${language.percent}%`).join(", ")}
                      {languages.length > 0 && project.lastCommitAt && ". "}
                      {project.lastCommitAt && `Latest commit ${monthYear.format(project.lastCommitAt)}`}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {portfolio.goals.length > 0 && (
        <section aria-labelledby="portfolio-goals">
          <h2 id="portfolio-goals" className="mb-3 text-lg font-semibold">Completed goals</h2>
          <ul className="divide-y rounded-lg border bg-card">
            {portfolio.goals.map((goal, index) => (
              <li key={index} className="space-y-1.5 px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3 className="font-semibold wrap-break-word">{goal.title}</h3>
                  {goal.completedAt && <p className="text-xs text-muted-foreground tabular-nums">{monthYear.format(goal.completedAt)}</p>}
                </div>
                <p className="text-xs text-muted-foreground">{goal.topicName}</p>
                <p className="max-w-[65ch] text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">{goal.definitionOfDone}</p>
                {goal.description && <p className="max-w-[65ch] text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-muted-foreground">{goal.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
