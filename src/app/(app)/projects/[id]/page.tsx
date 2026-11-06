import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Disclosure } from "@/components/disclosure";
import { updateProjectAction } from "@/features/projects/actions";
import { ProjectDetail } from "@/features/projects/components/project-detail";
import { ProjectForm } from "@/features/projects/components/project-form";
import { getProject, listProjectGoals } from "@/features/projects/queries";
import { requireScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "Project · Programming Study Tracker" };

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const scope = await requireScope();
  const project = await getProject(scope, id);
  if (!project) notFound();
  const goals = await listProjectGoals(scope, project.id);

  return (
    <ProjectDetail
      project={project}
      goals={goals}
      aside={
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
      }
    />
  );
}
