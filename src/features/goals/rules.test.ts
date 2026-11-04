import { expect, test } from "vitest";
import { assessGoalTransition, goalTransitions } from "@/features/goals/rules";
import { createGoalSchema, changeGoalStatusSchema } from "@/features/goals/schemas";
import { topicSchema } from "@/features/topics/schemas";
import { activeGoalLimitSchema } from "@/features/settings/schemas";

const goal = {
  topicId: "11111111-1111-4111-8111-111111111111", title: "Build a form",
  description: "", definitionOfDone: "Keyboard users can submit it", targetDate: "", status: "planned",
};

test("new goals require a definition of done and start only planned or active", () => {
  expect(createGoalSchema.safeParse({ ...goal, definitionOfDone: "  " }).success).toBe(false);
  expect(createGoalSchema.safeParse({ ...goal, status: "completed" }).success).toBe(false);
  expect(createGoalSchema.parse(goal).targetDate).toBeNull();
});

test.each(["2026-02-30", "2026-13-01", "2026-01-01T00:00:00Z"])("rejects invalid target date %s", (targetDate) => {
  expect(createGoalSchema.safeParse({ ...goal, targetDate }).success).toBe(false);
});

test("valid leap dates remain calendar dates", () => {
  expect(createGoalSchema.parse({ ...goal, targetDate: "2028-02-29" }).targetDate).toBe("2028-02-29");
});

test("topic inputs trim names, allow blank descriptions, and reject browser ownership", () => {
  expect(topicSchema.parse({ name: " React ", description: " " })).toEqual({ name: "React", description: null });
  expect(topicSchema.safeParse({ name: "React", description: "", user_id: "forged" }).success).toBe(false);
});

test.each(["0", "11", "1.5", "", "3e0", "true"])("rejects an invalid active limit: %s", (activeGoalLimit) => {
  expect(activeGoalLimitSchema.safeParse({ activeGoalLimit }).success).toBe(false);
});

test.each(["1", "3", "10"])("accepts a whole active limit: %s", (activeGoalLimit) => {
  expect(activeGoalLimitSchema.parse({ activeGoalLimit }).activeGoalLimit).toBe(Number(activeGoalLimit));
});

test("reopening uses a free active slot", () => {
  expect(assessGoalTransition({ from: "completed", to: "active", activeCount: 3, limit: 3 }).ok).toBe(false);
  expect(assessGoalTransition({ from: "completed", to: "active", activeCount: 2, limit: 3 }).ok).toBe(true);
});

test("an active goal can move to planned even when every slot is full", () => {
  expect(assessGoalTransition({ from: "active", to: "planned", activeCount: 3, limit: 3 }).ok).toBe(true);
});

test("completion needs confirmation in both the form schema and transition rule", () => {
  const input = { id: goal.topicId, status: "completed", confirmed: false };
  expect(changeGoalStatusSchema.safeParse(input).success).toBe(false);
  expect(assessGoalTransition({ from: "active", to: "completed", activeCount: 1, limit: 3 }).ok).toBe(false);
  expect(assessGoalTransition({ from: "active", to: "completed", activeCount: 1, limit: 3, confirmed: true }).ok).toBe(true);
});

test("archived goals have no transitions and archived topics cannot receive active goals", () => {
  expect(goalTransitions.archived).toEqual([]);
  expect(assessGoalTransition({ from: "archived", to: "active", activeCount: 0, limit: 3 }).ok).toBe(false);
  expect(assessGoalTransition({ from: "planned", to: "active", activeCount: 0, limit: 3, topicArchived: true }).ok).toBe(false);
});
