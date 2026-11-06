import "server-only";

import { eq } from "drizzle-orm";
import { profiles } from "@/db/schema";
import type { PortfolioField, PortfolioFormValues, PortfolioInput } from "@/features/portfolio/schemas";
import type { UserScope } from "@/lib/auth/scope";
import { databaseErrorCode, postgresErrorCodes } from "@/lib/db/errors";
import type { FormResult } from "@/lib/forms/action-state";

export async function getPortfolioSettings({ db, userId }: UserScope): Promise<PortfolioFormValues> {
  const [profile] = await db.select({
    enabled: profiles.portfolioEnabled,
    slug: profiles.portfolioSlug,
    displayName: profiles.displayName,
    headline: profiles.portfolioHeadline,
    githubUsername: profiles.githubUsername,
  }).from(profiles).where(eq(profiles.userId, userId));
  if (!profile) throw new Error("The signed-in user has no profile.");
  return {
    enabled: profile.enabled,
    slug: profile.slug ?? "",
    displayName: profile.displayName ?? "",
    headline: profile.headline ?? "",
    githubUsername: profile.githubUsername ?? "",
  };
}

export async function updatePortfolioSettings(
  { db, userId }: UserScope,
  input: PortfolioInput,
): Promise<FormResult<PortfolioField, { slug: string | null }>> {
  try {
    const [profile] = await db.update(profiles).set({
      portfolioEnabled: input.enabled,
      portfolioSlug: input.slug,
      displayName: input.displayName,
      portfolioHeadline: input.headline,
      githubUsername: input.githubUsername,
    }).where(eq(profiles.userId, userId)).returning({ slug: profiles.portfolioSlug });
    return profile ? { ok: true, data: profile } : { ok: false, error: "Your profile could not be found." };
  } catch (error) {
    if (databaseErrorCode(error) === postgresErrorCodes.uniqueViolation) {
      return { ok: false, error: "Check the highlighted fields.", fieldErrors: { slug: ["That address is taken. Try another one."] } };
    }
    throw error;
  }
}
