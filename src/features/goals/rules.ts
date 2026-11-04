import type { GoalStatus } from "@/features/goals/schemas";

export const goalStatusLabels: Record<GoalStatus, string> = {
  planned: "Planned", active: "Active", completed: "Completed", archived: "Archived",
};

export const goalTransitions: Record<GoalStatus, readonly GoalStatus[]> = {
  planned: ["active", "archived"],
  active: ["planned", "completed", "archived"],
  completed: ["active", "archived"],
  archived: [],
};

export function assessGoalTransition({
  from, to, activeCount, limit, topicArchived = false, confirmed = false,
}: {
  from: GoalStatus;
  to: GoalStatus;
  activeCount: number;
  limit: number;
  topicArchived?: boolean;
  confirmed?: boolean;
}): { ok: true } | { ok: false; error: string } {
  if (!Number.isInteger(limit) || limit < 1 || limit > 10 ||
      !Number.isInteger(activeCount) || activeCount < 0) {
    return { ok: false, error: "The active goal limit could not be checked. Please try again." };
  }
  if (from === to) return { ok: true };
  if (!goalTransitions[from].includes(to)) {
    return { ok: false, error: "That goal status change is not available." };
  }
  if (to === "active") {
    if (topicArchived) return { ok: false, error: "A goal in an archived topic cannot become active." };
    if (activeCount >= limit) return { ok: false, error: "Your active goal limit is reached. Move a goal to planned first." };
  }
  if (to === "completed" && !confirmed) {
    return { ok: false, error: "Confirm that you've met the definition of done." };
  }
  return { ok: true };
}
