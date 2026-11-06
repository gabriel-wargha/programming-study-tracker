import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { confidenceRatings } from "@/db/schema";
import type { ConfidenceEntry } from "@/features/confidence/schemas";
import type { UserScope } from "@/lib/auth/scope";
import { isUuid } from "@/lib/ids";

/** Newest first, so the first entry is the current rating. */
export async function listConfidenceRatings({ db, userId }: UserScope, topicId: string): Promise<ConfidenceEntry[]> {
  if (!isUuid(topicId)) return [];
  return db.select({ id: confidenceRatings.id, rating: confidenceRatings.rating, ratedAt: confidenceRatings.ratedAt })
    .from(confidenceRatings)
    .where(and(eq(confidenceRatings.userId, userId), eq(confidenceRatings.topicId, topicId)))
    .orderBy(desc(confidenceRatings.ratedAt), desc(confidenceRatings.createdAt));
}
