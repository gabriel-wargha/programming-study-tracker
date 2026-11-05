import type { Metadata } from "next";
import { createProjectAction } from "@/features/projects/actions";
import { ProjectForm } from "@/features/projects/components/project-form";
import { ProjectList } from "@/features/projects/components/project-list";
import { listProjects } from "@/features/projects/queries";
import { requireScope } from "@/lib/auth/scope";

export const metadata: Metadata = { title: "Projects · Programming Study Tracker" };

export default async function ProjectsPage() {
  const projects = await listProjects(await requireScope());

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <section aria-labelledby="projects-heading">
        <h1 id="projects-heading" className="mb-6 text-3xl font-semibold tracking-tight">Projects</h1>
        <ProjectList projects={projects} />
      </section>
      <section aria-labelledby="new-project-heading" className="h-fit rounded-xl border bg-card p-6">
        <h2 id="new-project-heading" className="mb-4 text-lg font-semibold">New project</h2>
        <ProjectForm action={createProjectAction} />
      </section>
    </div>
  );
}
