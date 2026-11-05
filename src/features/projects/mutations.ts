import "server-only";

import { and, eq } from "drizzle-orm";
import { projects } from "@/db/schema";
import type { ProjectField, ProjectInput } from "@/features/projects/schemas";
import type { UserScope } from "@/lib/auth/scope";
import type { FormResult } from "@/lib/forms/action-state";

type ProjectResult = FormResult<ProjectField, { id: string }>;

export async function createProject({ db, userId }: UserScope, input: ProjectInput): Promise<ProjectResult> {
  const [project] = await db.insert(projects).values({ userId, ...input }).returning({ id: projects.id });
  return { ok: true, data: project };
}

export async function updateProject({ db, userId }: UserScope, id: string, input: ProjectInput): Promise<ProjectResult> {
  const [project] = await db.update(projects).set(input)
    .where(and(eq(projects.id, id), eq(projects.userId, userId))).returning({ id: projects.id });
  return project ? { ok: true, data: project } : { ok: false, error: "This project could not be found." };
}
