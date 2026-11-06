import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Disclosure } from "@/components/disclosure";
import { Panel } from "@/components/page-header";
import { PublicToggleForm } from "@/features/portfolio/components/public-toggle-form";
import { refreshProjectAction, setProjectPublicAction, updateProjectAction } from "@/features/projects/actions";
import { GitHubDetails } from "@/features/projects/components/github-details";
import { RefreshProjectForm } from "@/features/projects/components/refresh-project-form";
import { gitHubSyncMessages, type GitHubSyncFailure } from "@/features/projects/schemas";
import { ProjectDetail } from "@/features/projects/components/project-detail";
import { ProjectForm } from "@/features/projects/components/project-form";
import { getProject, listProjectGoals } from "@/features/projects/queries";
import { requireScope } from "@/lib/auth/scope";
import { getOwnerCalendar } from "@/lib/dates/owner-today";
import { parseGitHubRepoUrl } from "@/lib/github/parse-repo-url";

export const metadata: Metadata = { title: "Project · Programming Study Tracker" };

export default async function ProjectPage({ params, searchParams }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const { github } = await searchParams;
  const scope = await requireScope();
  const project = await getProject(scope, id);
  if (!project) notFound();
  const [goals, { timeZone }] = await Promise.all([listProjectGoals(scope, project.id), getOwnerCalendar()]);
  const message = typeof github === "string" && Object.hasOwn(gitHubSyncMessages, github)
    ? gitHubSyncMessages[github as GitHubSyncFailure] : undefined;

  return (
    <ProjectDetail
      project={project}
      goals={goals}
      aside={<>
        {parseGitHubRepoUrl(project.repoUrl) && (
          <GitHubDetails
            project={project}
            timeZone={timeZone}
            now={new Date()}
            message={message}
            refresh={<RefreshProjectForm action={refreshProjectAction} projectId={project.id} />}
          />
        )}
        <Panel title="Portfolio" id="project-portfolio-heading">
          <PublicToggleForm action={setProjectPublicAction} id={project.id} isPublic={project.isPublic} noun="project" />
        </Panel>
        <Disclosure summary="Edit project">
          <ProjectForm
            key={[project.title, project.repoUrl, project.liveUrl, project.description].join("\n")}
            action={updateProjectAction}
            initialValues={{
              id: project.id, title: project.title, repoUrl: project.repoUrl,
              liveUrl: project.liveUrl ?? "", description: project.description ?? "",
            }}
          />
        </Disclosure>
      </>}
    />
  );
}
