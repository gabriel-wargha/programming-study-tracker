import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";
import { cache } from "react";
import { getDatabase } from "@/db/client";
import { goals, profiles, projects, topics } from "@/db/schema";
import type { AppDatabase } from "@/db/types";

export type PublicPortfolio = {
  displayName: string | null;
  headline: string | null;
  githubUsername: string | null;
  goals: { title: string; description: string | null; definitionOfDone: string; topicName: string; completedAt: Date | null }[];
  projects: {
    title: string;
    description: string | null;
    repoUrl: string;
    liveUrl: string | null;
    primaryLanguage: string | null;
    languages: Record<string, number> | null;
    lastCommitAt: Date | null;
  }[];
};

/**
 * The only code path that reads data without a signed-in user. Every column is
 * listed by hand: no IDs, activities, time, blockers, ratings, resources, or
 * reminders. A disabled portfolio and an unknown slug look the same to a visitor.
 */
export async function getPublicPortfolio(slug: string, database?: AppDatabase): Promise<PublicPortfolio | null> {
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return null;
  const db = database ?? await getDatabase();
  const [profile] = await db.select({
    ownerId: profiles.userId,
    displayName: profiles.displayName,
    headline: profiles.portfolioHeadline,
    githubUsername: profiles.githubUsername,
  }).from(profiles).where(and(eq(profiles.portfolioSlug, slug), eq(profiles.portfolioEnabled, true)));
  if (!profile) return null;

  const [publicGoals, publicProjects] = await Promise.all([
    db.select({
      title: goals.title,
      description: goals.description,
      definitionOfDone: goals.definitionOfDone,
      topicName: topics.name,
      completedAt: goals.completedAt,
    }).from(goals)
      .innerJoin(topics, and(eq(topics.id, goals.topicId), eq(topics.userId, goals.userId)))
      .where(and(eq(goals.userId, profile.ownerId), eq(goals.isPublic, true), eq(goals.status, "completed")))
      .orderBy(desc(goals.completedAt)),
    db.select({
      title: projects.title,
      description: projects.description,
      repoUrl: projects.repoUrl,
      liveUrl: projects.liveUrl,
      primaryLanguage: projects.githubPrimaryLanguage,
      languages: projects.githubLanguages,
      lastCommitAt: projects.githubLastCommitAt,
    }).from(projects)
      .where(and(eq(projects.userId, profile.ownerId), eq(projects.isPublic, true)))
      .orderBy(asc(sql`lower(${projects.title})`)),
  ]);

  return {
    displayName: profile.displayName,
    headline: profile.headline,
    githubUsername: profile.githubUsername,
    goals: publicGoals,
    projects: publicProjects,
  };
}

/** One lookup per request, shared by the page and its metadata. */
export const getPublicPortfolioForRequest = cache((slug: string) => getPublicPortfolio(slug));
