import "server-only";

import { confidenceRatings } from "@/db/schema";
import type { ConfidenceField } from "@/features/confidence/schemas";
import type { UserScope } from "@/lib/auth/scope";
import { databaseErrorCode, postgresErrorCodes } from "@/lib/db/errors";
import type { FormResult } from "@/lib/forms/action-state";

export async function addConfidenceRating(
  { db, userId }: UserScope,
  input: { topicId: string; rating: number },
): Promise<FormResult<ConfidenceField, { rating: number }>> {
  try {
    const [row] = await db.insert(confidenceRatings).values({ userId, ...input }).returning({ rating: confidenceRatings.rating });
    return { ok: true, data: row };
  } catch (error) {
    if (databaseErrorCode(error) === postgresErrorCodes.foreignKeyViolation) {
      return { ok: false, error: "This topic could not be found." };
    }
    throw error;
  }
}
