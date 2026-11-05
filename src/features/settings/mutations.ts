import "server-only";

import { eq } from "drizzle-orm";
import { profiles } from "@/db/schema";
import { listActiveGoals } from "@/features/goals/queries";
import type { UserScope } from "@/lib/auth/scope";
import { databaseErrorCode, ruleErrorCodes } from "@/lib/db/errors";
import type { FormResult } from "@/lib/forms/action-state";

export async function updateActiveGoalLimit(
  scope: UserScope,
  activeGoalLimit: number,
): Promise<FormResult<"activeGoalLimit", { activeGoalLimit: number }>> {
  try {
    const [profile] = await scope.db.update(profiles).set({ activeGoalLimit })
      .where(eq(profiles.userId, scope.userId)).returning({ activeGoalLimit: profiles.activeGoalLimit });
    return profile ? { ok: true, data: profile } : { ok: false, error: "Your profile could not be found." };
  } catch (error) {
    if (databaseErrorCode(error) === ruleErrorCodes.limitBelowActiveCount) {
      return {
        ok: false,
        error: "Move active goals to planned before lowering this limit.",
        activeGoals: await listActiveGoals(scope),
      };
    }
    throw error;
  }
}
