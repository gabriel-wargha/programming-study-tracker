/** Codes raised by the rule triggers (see drizzle/0003_topic_and_goal_rules.sql and 0005_activity_rules.sql, and 0009_learning_support_rules.sql). */
export const ruleErrorCodes = {
  activeGoalLimitReached: "SL001",
  topicHasActiveGoals: "SL002",
  limitBelowActiveCount: "SL003",
  archivedTopic: "SL004",
  invalidStatusChange: "SL005",
  ownershipChange: "SL006",
  goalNotActive: "SL007",
  futureActivityDate: "SL008",
  resourceOutsideTopic: "SL009",
  prerequisiteLoop: "SL010",
} as const;

export const postgresErrorCodes = {
  uniqueViolation: "23505",
  foreignKeyViolation: "23503",
  checkViolation: "23514",
} as const;

/** Finds the PostgreSQL SQLSTATE code, which drivers may wrap in `cause`. */
export function databaseErrorCode(error: unknown): string | undefined {
  for (let current = error, depth = 0; current && depth < 5; depth += 1) {
    if (typeof current !== "object") return undefined;
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return code;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

/** The name of the constraint that failed, when the driver reports one. */
export function databaseErrorConstraint(error: unknown): string | undefined {
  for (let current = error, depth = 0; current && depth < 5; depth += 1) {
    if (typeof current !== "object") return undefined;
    const constraint = (current as { constraint?: unknown }).constraint;
    if (typeof constraint === "string" && constraint) return constraint;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}
