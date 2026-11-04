import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { GoalList } from "@/features/goals/components/goal-list";
import { TopicList } from "@/features/topics/components/topic-list";
import { GoalDetail } from "@/features/goals/components/goal-detail";
import { formatCalendarDate } from "@/lib/dates/format-calendar-date";
import type { GoalSummary } from "@/features/goals/schemas";

const goal: GoalSummary = {
  id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa", topicId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  topicName: "React", title: "Build a form", description: null,
  definitionOfDone: "Keyboard users can submit the form", status: "active", targetDate: "2026-11-04",
};

afterEach(() => vi.unstubAllEnvs());

test("empty topic and goal lists explain how to begin", () => {
  render(<><TopicList topics={[]} /><GoalList goals={[]} /></>);
  expect(screen.getByRole("heading", { name: "No topics yet" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "No goals yet" })).toBeVisible();
});

test("goals can be filtered by status and communicate status in text", () => {
  render(<GoalList status="active" goals={[goal, { ...goal, id: goal.topicId, title: "A future goal", status: "planned" }]} />);
  expect(screen.getByRole("link", { name: "Build a form" })).toBeVisible();
  expect(screen.queryByRole("link", { name: "A future goal" })).not.toBeInTheDocument();
  expect(screen.getByText("Active", { exact: true })).toBeVisible();
});

test("the goal detail makes its finish line a named section", () => {
  render(<GoalDetail goal={goal} />);
  expect(screen.getByRole("region", { name: "Definition of done" })).toHaveTextContent(goal.definitionOfDone);
});

test.each(["America/Boise", "Pacific/Auckland"])("target dates do not shift in %s", (timezone) => {
  vi.stubEnv("TZ", timezone);
  expect(formatCalendarDate("2026-01-01")).toBe("Jan 1, 2026");
});
