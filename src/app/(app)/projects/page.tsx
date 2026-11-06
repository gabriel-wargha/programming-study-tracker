import type { Metadata } from "next";
import { Panel, PageHeader } from "@/components/page-header";
import { createProjectAction } from "@/features/projects/actions";
import { ProjectForm } from "@/features/projects/components/project-form";
import { ProjectList } from "@/features/projects/components/project-list";
import { listProjects } from "@/features/projects/queries";
import { requireScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "Projects · Programming Study Tracker" };

export default async function ProjectsPage() {
  const projects = await listProjects(await requireScope());

  return (
    <>
      <PageHeader title="Projects" description="Things you built while studying, with links to their code." />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-label="Your projects">
          <ProjectList projects={projects} />
        </section>
        <Panel title="New project" id="new-project-heading" className="h-fit">
          <ProjectForm action={createProjectAction} />
        </Panel>
      </div>
    </>
  );
}
