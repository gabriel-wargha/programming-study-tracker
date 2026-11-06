import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { projects } from "@/db/schema";
import type { GitHubSyncFailure, ProjectField, ProjectInput } from "@/features/projects/schemas";
import type { UserScope } from "@/lib/auth/scope";
import type { FormResult } from "@/lib/forms/action-state";
import { fetchRepositoryDetails } from "@/lib/github/client";
import { parseGitHubRepoUrl } from "@/lib/github/parse-repo-url";

type ProjectResult = FormResult<ProjectField, { id: string }>;

export async function createProject({ db, userId }: UserScope, input: ProjectInput): Promise<ProjectResult> {
  const [project] = await db.insert(projects).values({ userId, ...input }).returning({ id: projects.id });
  return { ok: true, data: project };
}

const noGitHubDetails = {
  githubFullName: null, githubDescription: null, githubPrimaryLanguage: null,
  githubLanguages: null, githubLastCommitAt: null, githubSyncedAt: null,
};

export async function updateProject({ db, userId }: UserScope, id: string, input: ProjectInput): Promise<ProjectResult> {
  const owned = and(eq(projects.id, id), eq(projects.userId, userId));
  const [current] = await db.select({ repoUrl: projects.repoUrl }).from(projects).where(owned);
  if (!current) return { ok: false, error: "This project could not be found." };
  // Details of the old repository must not stay on the project when its link changes.
  const details = current.repoUrl === input.repoUrl ? {} : noGitHubDetails;
  const [project] = await db.update(projects).set({ ...input, ...details }).where(owned).returning({ id: projects.id });
  return project ? { ok: true, data: project } : { ok: false, error: "This project could not be found." };
}

/**
 * Updates saved GitHub details for a public repository. The project is already
 * saved, so a GitHub problem is reported but never undoes anything.
 */
export async function syncProjectGitHub(
  { db, userId }: UserScope,
  id: string,
  options: Parameters<typeof fetchRepositoryDetails>[1] = {},
): Promise<{ ok: true; synced: boolean } | { ok: false; reason: GitHubSyncFailure | "missing_project" }> {
  const owned = and(eq(projects.id, id), eq(projects.userId, userId));
  const [project] = await db.select({ repoUrl: projects.repoUrl }).from(projects).where(owned);
  if (!project) return { ok: false, reason: "missing_project" };
  const repository = parseGitHubRepoUrl(project.repoUrl);
  if (!repository) return { ok: true, synced: false };

  const result = await fetchRepositoryDetails(repository, options);
  if (!result.ok) return { ok: false, reason: result.reason };
  const { fullName, description, primaryLanguage, languages, lastCommitAt } = result.details;
  // The link may have changed while GitHub was answering; don't save details for the wrong repository.
  await db.update(projects).set({
    githubFullName: fullName,
    githubDescription: description,
    githubPrimaryLanguage: primaryLanguage,
    githubLanguages: languages,
    githubLastCommitAt: lastCommitAt,
    githubSyncedAt: sql`now()`,
  }).where(and(owned, eq(projects.repoUrl, project.repoUrl)));
  return { ok: true, synced: true };
}

export async function setProjectPublic({ db, userId }: UserScope, id: string, isPublic: boolean): Promise<FormResult<"id", { isPublic: boolean }>> {
  const [project] = await db.update(projects).set({ isPublic })
    .where(and(eq(projects.id, id), eq(projects.userId, userId))).returning({ isPublic: projects.isPublic });
  return project ? { ok: true, data: project } : { ok: false, error: "This project could not be found." };
}
